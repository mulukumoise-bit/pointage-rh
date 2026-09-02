import { useEffect, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  getListPointagesQueryKey,
  useCreateAdminSession,
  useCreateCompany,
  useCreatePointage,
  useListPointages,
  useListCompanies,
} from '@workspace/api-client-react';
import * as XLSX from 'xlsx';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  ArrowRight,
  Check,
  CircleAlert,
  Clock3,
  Crosshair,
  Download,
  FileSpreadsheet,
  History,
  LockKeyhole,
  LogIn,
  LogOut,
  MapPin,
  Navigation,
  RefreshCw,
  ShieldCheck,
  Building2,
  KeyRound,
  Plus,
  UnlockKeyhole,
} from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type CheckInStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'unsupported'
  | 'error';

type CheckAction = 'arrivee' | 'depart';

type Coordinates = {
  latitude: number;
  longitude: number;
};

const statusCopy: Record<
  Exclude<CheckInStatus, 'idle' | 'loading' | 'success'>,
  { title: string; description: string }
> = {
  denied: {
    title: 'Position non autorisée',
    description:
      'Votre navigateur a refusé l’accès à la position. Autorisez-la dans les réglages du site, puis réessayez.',
  },
  unavailable: {
    title: 'Position indisponible',
    description:
      'Votre position ne peut pas être déterminée pour le moment. Vérifiez votre connexion ou le signal GPS.',
  },
  timeout: {
    title: 'La recherche a pris trop de temps',
    description:
      'Nous n’avons pas reçu votre position à temps. Vous pouvez relancer la recherche.',
  },
  unsupported: {
    title: 'Géolocalisation indisponible',
    description:
      'Ce navigateur ne permet pas de partager une position. Utilisez un navigateur récent pour pointer votre présence.',
  },
  error: {
    title: 'Pointage non enregistré',
    description:
      'Un problème inattendu est survenu pendant la recherche. Veuillez réessayer.',
  },
};

const frenchDate = (date: Date) =>
  new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);

const frenchTime = (date: Date) =>
  new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);

const frenchDateTime = (date: Date) =>
  new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date);

const csvCell = (value: string | number) =>
  `"${String(value).replaceAll('"', '""')}"`;

const exportDate = () => new Date().toISOString().slice(0, 10);

const actionNoun = (action: CheckAction) =>
  action === 'arrivee' ? 'Arrivée' : 'Départ';

const actionSuccessLabel = (action: CheckAction) =>
  action === 'arrivee' ? 'Arrivée pointée' : 'Départ pointé';

const selectedCompanyKey = 'pointage-rh-company-id';
const adminTokenKey = 'pointage-rh-admin-token';
const adminCompanyKey = 'pointage-rh-admin-company-id';

function CompanyGate({
  companies,
  isLoading,
  isError,
  selectedCompanyId,
  onSelect,
  onRetry,
}: {
  companies: Array<{ id: number; name: string }>;
  isLoading: boolean;
  isError: boolean;
  selectedCompanyId: number | null;
  onSelect: (id: number) => void;
  onRetry: () => void;
}) {
  const [newCompanyName, setNewCompanyName] = useState('');
  const [createError, setCreateError] = useState('');
  const createCompanyMutation = useCreateCompany();

  const createCompany = () => {
    const name = newCompanyName.trim();
    if (!name) {
      setCreateError('Indiquez le nom de votre entreprise.');
      return;
    }
    setCreateError('');
    createCompanyMutation.mutate(
      { data: { name } },
      {
        onSuccess: (company) => {
          setNewCompanyName('');
          onSelect(company.id);
        },
        onError: () => setCreateError('Cette entreprise n’a pas pu être créée. Réessayez.'),
      },
    );
  };

  return (
    <section className="company-gate" aria-labelledby="company-heading">
      <div className="gate-mark" aria-hidden="true"><Building2 size={24} /></div>
      <p className="eyebrow">Pointage RH · accès équipe</p>
      <h1 id="company-heading">Choisissez votre entreprise.</h1>
      <p className="gate-intro">
        Le pointage reste immédiat pour les salariés. Les données de présence sont
        ensuite réservées à l’administrateur de l’entreprise.
      </p>

      {isLoading ? (
        <div className="company-loading" role="status" data-testid="status-companies-loading">
          <span className="skeleton-line wide" />
          <span className="skeleton-line" />
          <span className="skeleton-line short" />
          <span>Chargement des entreprises…</span>
        </div>
      ) : isError ? (
        <div className="inline-alert error" role="alert" data-testid="status-companies-error">
          <CircleAlert size={18} aria-hidden="true" />
          <span>Les entreprises ne sont pas accessibles pour le moment.</span>
          <button type="button" className="text-button" onClick={onRetry} data-testid="button-retry-companies">
            <RefreshCw size={14} aria-hidden="true" /> Réessayer
          </button>
        </div>
      ) : (
        <>
          <div className="company-list" aria-label="Entreprises disponibles">
            {companies.length === 0 ? (
              <div className="empty-company" data-testid="status-companies-empty">
                <Building2 size={18} aria-hidden="true" />
                <span>Aucune entreprise n’est encore configurée. Créez la première ci-dessous.</span>
              </div>
            ) : (
              companies.map((company) => (
                <button
                  type="button"
                  key={company.id}
                  className={`company-option ${selectedCompanyId === company.id ? 'selected' : ''}`}
                  onClick={() => onSelect(company.id)}
                  data-testid={`button-company-${company.id}`}
                >
                  <span className="company-avatar" aria-hidden="true">{company.name.slice(0, 1).toUpperCase()}</span>
                  <span className="company-option-copy">
                    <strong>{company.name}</strong>
                    <small>Entreprise active</small>
                  </span>
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              ))
            )}
          </div>
          <div className="create-company">
            <div className="create-company-heading">
              <span className="mini-rule" aria-hidden="true" />
              <span>Créer une entreprise</span>
            </div>
            <div className="create-company-form">
              <label className="sr-only" htmlFor="new-company-name">Nom de l’entreprise</label>
              <input
                id="new-company-name"
                className={`text-input ${createError ? 'invalid' : ''}`}
                value={newCompanyName}
                onChange={(event) => {
                  setNewCompanyName(event.target.value);
                  if (createError) setCreateError('');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') createCompany();
                }}
                placeholder="Ex. Atelier des Rives"
                data-testid="input-company-name"
              />
              <button
                type="button"
                className="dark-button"
                onClick={createCompany}
                disabled={createCompanyMutation.isPending}
                data-testid="button-create-company"
              >
                <Plus size={17} aria-hidden="true" />
                {createCompanyMutation.isPending ? 'Création…' : 'Créer'}
              </button>
            </div>
            {createError && <p className="validation-message" role="alert" data-testid="status-create-company-error">{createError}</p>}
            {createCompanyMutation.isSuccess && (
              <p className="success-message" role="status" data-testid="status-create-company-success">
                Entreprise créée. Son espace administrateur est prêt.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function Home() {
  const [now, setNow] = useState(() => new Date());
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(() => {
    const stored = window.localStorage.getItem(selectedCompanyKey);
    return stored ? Number(stored) : null;
  });
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [status, setStatus] = useState<CheckInStatus>('idle');
  const [lastAction, setLastAction] = useState<CheckAction>('arrivee');
  const [capturedAt, setCapturedAt] = useState<Date | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(() => window.sessionStorage.getItem(adminTokenKey));
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { data: companies = [], isLoading: isCompaniesLoading, isError: isCompaniesError, refetch: refetchCompanies } = useListCompanies();
  const createAdminSessionMutation = useCreateAdminSession();
  const {
    data: pointages = [],
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    refetch: refetchHistory,
  } = useListPointages(
    { companyId: selectedCompanyId ?? 0 },
    {
      query: {
        enabled: Boolean(selectedCompanyId && adminToken),
        queryKey: getListPointagesQueryKey({ companyId: selectedCompanyId ?? 0 }),
      },
      request: adminToken ? { headers: { Authorization: `Bearer ${adminToken}` } } : undefined,
    },
  );
  const createPointageMutation = useCreatePointage();
  const selectedCompany = companies.find((company) => company.id === selectedCompanyId) ?? null;
  const history = pointages;

  useEffect(() => {
    if (companies.length === 0 || selectedCompanyId === null) return;
    if (!companies.some((company) => company.id === selectedCompanyId)) {
      setSelectedCompanyId(null);
      window.localStorage.removeItem(selectedCompanyKey);
    }
  }, [companies, selectedCompanyId]);

  useEffect(() => {
    if (!selectedCompanyId) return;
    const storedCompany = window.sessionStorage.getItem(adminCompanyKey);
    if (storedCompany !== String(selectedCompanyId)) {
      window.sessionStorage.removeItem(adminTokenKey);
      window.sessionStorage.removeItem(adminCompanyKey);
      setAdminToken(null);
    }
  }, [selectedCompanyId]);

  const chooseCompany = (id: number) => {
    if (id === selectedCompanyId) return;
    setSelectedCompanyId(id);
    window.localStorage.setItem(selectedCompanyKey, String(id));
    window.sessionStorage.removeItem(adminTokenKey);
    window.sessionStorage.removeItem(adminCompanyKey);
    setAdminToken(null);
    setAdminPassword('');
    setAdminError('');
    setAdminSuccess('');
    queryClient.removeQueries({ queryKey: getListPointagesQueryKey({ companyId: id }) });
    setStatus('idle');
  };

  const lockAdmin = () => {
    window.sessionStorage.removeItem(adminTokenKey);
    window.sessionStorage.removeItem(adminCompanyKey);
    setAdminToken(null);
    setAdminPassword('');
    setAdminSuccess('');
    setAdminError('');
    queryClient.removeQueries({ queryKey: getListPointagesQueryKey({ companyId: selectedCompanyId ?? 0 }) });
  };

  const unlockAdmin = () => {
    if (!selectedCompanyId) return;
    if (!adminPassword.trim()) {
      setAdminError('Saisissez le mot de passe administrateur.');
      return;
    }
    setAdminError('');
    setAdminSuccess('');
    createAdminSessionMutation.mutate(
      { companyId: selectedCompanyId, data: { password: adminPassword } },
      {
        onSuccess: (session) => {
          window.sessionStorage.setItem(adminTokenKey, session.token);
          window.sessionStorage.setItem(adminCompanyKey, String(selectedCompanyId));
          setAdminToken(session.token);
          setAdminPassword('');
          setAdminSuccess(`Espace administrateur déverrouillé pour ${session.company.name}.`);
        },
        onError: () => setAdminError('Mot de passe incorrect ou accès temporairement indisponible.'),
      },
    );
  };

  const exportRows = history.map((entry) => ({
    'Nom / Prénom': entry.name,
    Action: actionNoun(entry.action),
    'Date et heure': frenchDateTime(new Date(entry.recordedAt)),
    Latitude: entry.latitude,
    Longitude: entry.longitude,
  }));

  const downloadCsv = () => {
    if (history.length === 0) {
      return;
    }

    const rows = [
      ['Nom / Prénom', 'Action', 'Date et heure', 'Latitude', 'Longitude'],
      ...exportRows.map((row) => [
        row['Nom / Prénom'],
        row.Action,
        row['Date et heure'],
        row.Latitude.toFixed(5),
        row.Longitude.toFixed(5),
      ]),
    ];
    const csv = `\uFEFF${rows
      .map((row) => row.map((cell) => csvCell(cell)).join(','))
      .join('\r\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `pointages-${exportDate()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = () => {
    if (history.length === 0) {
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    worksheet['!cols'] = [
      { wch: 24 },
      { wch: 14 },
      { wch: 21 },
      { wch: 14 },
      { wch: 14 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pointages');
    XLSX.writeFile(workbook, `pointages-${exportDate()}.xlsx`);
  };

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(clock);
  }, []);

  const requestLocation = (action: CheckAction) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Veuillez renseigner votre nom et prénom avant de pointer.');
      nameInputRef.current?.focus();
      return;
    }

    const clickTime = new Date();
    setNameError('');
    setLastAction(action);
    setCapturedAt(clickTime);
    setCoordinates(null);

    if (!('geolocation' in navigator)) {
      setStatus('unsupported');
      return;
    }

    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
          const nextCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCoordinates(nextCoordinates);

          createPointageMutation.mutate(
            {
    data: {
                 companyId: selectedCompanyId as number,
                 name: trimmedName,
                 action,
                 latitude: nextCoordinates.latitude,
                 longitude: nextCoordinates.longitude,
               },
            },
            {
              onSuccess: (pointage) => {
                setCapturedAt(new Date(pointage.recordedAt));
                setCoordinates({
                  latitude: pointage.latitude,
                  longitude: pointage.longitude,
                });
                setStatus('success');
                queryClient.invalidateQueries({
                   queryKey: getListPointagesQueryKey({ companyId: selectedCompanyId as number }),
                });
              },
              onError: () => {
                setStatus('error');
              },
            },
          );
      },
      (error) => {
        if (error.code === 1 || error.code === error.PERMISSION_DENIED) {
          setStatus('denied');
        } else if (
          error.code === 2 ||
          error.code === error.POSITION_UNAVAILABLE
        ) {
          setStatus('unavailable');
        } else if (error.code === 3 || error.code === error.TIMEOUT) {
          setStatus('timeout');
        } else {
          setStatus('error');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      },
    );
  };

  const isLoading = status === 'loading' || createPointageMutation.isPending;
  const isSuccess = status === 'success' && Boolean(capturedAt && coordinates);
  const isFailure =
    status !== 'idle' && status !== 'loading' && status !== 'success';
  const currentFailure = isFailure
    ? statusCopy[status as Exclude<CheckInStatus, 'idle' | 'loading' | 'success'>]
    : null;

  if (!selectedCompany) {
    return (
      <main className="arrival-page">
        <div className="arrival-shell">
          <header className="utility-header">
            <div className="brand-mark" aria-label="Pointage RH">
              <span className="brand-symbol" aria-hidden="true"><Clock3 size={20} /></span>
              <span><span className="brand-name">Pointage RH</span><span className="brand-kicker">Présence, sans détour</span></span>
            </div>
            <span className="secure-label"><span className="secure-dot" aria-hidden="true" /> Espace sécurisé</span>
          </header>
          <CompanyGate
            companies={companies}
            isLoading={isCompaniesLoading}
            isError={isCompaniesError}
            selectedCompanyId={selectedCompanyId}
            onSelect={chooseCompany}
            onRetry={() => refetchCompanies()}
          />
          <footer className="footer-row"><span><ShieldCheck size={14} aria-hidden="true" /> Vos informations restent confidentielles</span><span><Building2 size={13} aria-hidden="true" /> Une entreprise, un espace fiable</span></footer>
        </div>
      </main>
    );
  }

  const statusGlyph = isSuccess ? (
    <Check size={26} strokeWidth={2.2} aria-hidden="true" />
  ) : isFailure ? (
    <CircleAlert size={25} strokeWidth={1.8} aria-hidden="true" />
  ) : isLoading ? (
    <Crosshair size={27} strokeWidth={1.7} aria-hidden="true" />
  ) : (
    <MapPin size={26} strokeWidth={1.8} aria-hidden="true" />
  );

  return (
    <main className="arrival-page">
      <div className="arrival-shell">
        <header className="utility-header">
          <div className="brand-mark" aria-label="Pointage RH">
              <span className="brand-symbol" aria-hidden="true">
               <Clock3 size={19} strokeWidth={2} />
            </span>
            <span>
              <span className="brand-name">Pointage RH</span>
               <span className="brand-kicker">Présence, sans détour</span>
            </span>
          </div>
           <div className="company-switcher">
             <span className="company-current"><Building2 size={14} aria-hidden="true" /> {selectedCompany.name}</span>
             <button type="button" className="switch-company" onClick={() => chooseCompany(0)} data-testid="button-change-company">Changer</button>
           </div>
           <div className="secure-label" aria-label="Connexion locale et sécurisée">
            <span className="secure-dot" aria-hidden="true" />
            Local &amp; sécurisé
          </div>
        </header>

        <div className="ritual-layout">
          <section className="intro-panel" aria-labelledby="welcome-heading">
            <div>
              <p className="eyebrow">Bonjour, vous êtes au bon endroit</p>
              <h1 id="welcome-heading" className="intro-title">
                Commencer sa journée, <em>simplement.</em>
              </h1>
            </div>
            <div>
                 <p className="intro-caption">
                 Un pointage clair, en quelques secondes. Votre position confirme
                 votre présence et reste attachée à ce seul enregistrement.
              </p>
              <p className="intro-signal">
                <span className="signal-line" aria-hidden="true" />
                Un geste, une trace fiable
              </p>
            </div>
          </section>

          <section className="checkin-card" aria-labelledby="checkin-heading">
            <div className="date-row">
              <div>
                <p className="date-label">Aujourd’hui</p>
                <p className="date-value" data-testid="text-current-date">
                  {frenchDate(now)}
                </p>
              </div>
              <time
                className="clock-value"
                dateTime={now.toISOString()}
                data-testid="text-live-time"
                aria-label={`Heure actuelle ${frenchTime(now)}`}
              >
                {frenchTime(now)}
              </time>
            </div>

            <div className="ritual-content">
              <div
                className={`location-glyph ${isLoading ? 'loading' : ''} ${
                  isSuccess ? 'success' : ''
                } ${isFailure ? 'failure' : ''}`}
                aria-hidden="true"
              >
                {statusGlyph}
              </div>

              {isSuccess && capturedAt && coordinates ? (
                <div
                  className="status-region"
                  role="status"
                  aria-live="polite"
                  data-testid="status-checkin-success"
                >
                  <h2 id="checkin-heading" className="status-title">
                    {actionSuccessLabel(lastAction)}
                  </h2>
                     <p className="status-copy">
                     C’est enregistré pour <strong>{name.trim()}</strong>. La
                     confirmation est bien arrivée dans l’espace de votre entreprise.
                  </p>
                  <div className="status-details">
                    <div className="detail-item">
                      <span className="detail-label">Heure du pointage</span>
                      <time
                        className="detail-value"
                        dateTime={capturedAt.toISOString()}
                        data-testid="text-checkin-time"
                      >
                        {frenchTime(capturedAt)}
                      </time>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Position confirmée</span>
                      <span
                        className="detail-value"
                        data-testid="text-checkin-coordinates"
                      >
                        {coordinates.latitude.toFixed(5)}°,{' '}
                        {coordinates.longitude.toFixed(5)}°
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={() => requestLocation(lastAction)}
                    data-testid="button-checkin-again"
                  >
                    <RefreshCw size={14} aria-hidden="true" />
                    Pointer à nouveau
                  </button>
                </div>
              ) : isFailure ? (
                <div
                  className="status-region"
                  role="alert"
                  aria-live="assertive"
                  data-testid={`status-checkin-${status}`}
                >
                  <h2 id="checkin-heading" className="status-title">
                    {currentFailure?.title}
                  </h2>
                  <p className="status-copy">{currentFailure?.description}</p>
                  <div className="error-box">
                    <p>
                       Aucun pointage n’a été enregistré. Vos données restent
                       protégées.
                    </p>
                  </div>
                  {status !== 'unsupported' && (
                    <button
                      type="button"
                      className="secondary-action"
                      onClick={() => requestLocation(lastAction)}
                      data-testid="button-checkin-retry"
                    >
                      <RefreshCw size={14} aria-hidden="true" />
                      Réessayer
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className="status-region"
                  role={isLoading ? 'status' : undefined}
                  aria-live={isLoading ? 'polite' : undefined}
                  data-testid={
                    isLoading ? 'status-checkin-loading' : 'status-checkin-idle'
                  }
                >
                  <h2 id="checkin-heading" className="ritual-heading">
                    {isLoading
                      ? 'Nous vérifions votre présence.'
                      : 'Prêt à commencer ?'}
                  </h2>
                     <p className="ritual-copy">
                    {isLoading
                       ? 'Recherche de votre position… Gardez cette fenêtre ouverte quelques instants.'
                       : `Indiquez votre nom, puis choisissez votre arrivée ou votre départ. L’heure et votre position seront relevées pour ${selectedCompany.name}.`}
                  </p>
                </div>
              )}

              <form
                className="pointage-form"
                onSubmit={(event) => event.preventDefault()}
                noValidate
              >
                <div className="name-field">
                  <label className="name-label" htmlFor="employee-name">
                    <span>Nom / Prénom</span>
                    <span className="required-mark">Requis</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    id="employee-name"
                    name="employee-name"
                    className={`name-input ${nameError ? 'invalid' : ''}`}
                    type="text"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      if (nameError && event.target.value.trim()) {
                        setNameError('');
                      }
                    }}
                    placeholder="Ex. Camille Martin"
                    autoComplete="name"
                    required
                    aria-required="true"
                    aria-invalid={Boolean(nameError)}
                    aria-describedby={nameError ? 'name-error' : 'name-help'}
                    data-testid="input-name"
                  />
                  {nameError ? (
                    <p id="name-error" className="validation-message" role="alert">
                      {nameError}
                    </p>
                  ) : (
                    <p id="name-help" className="sr-only">
                      Le nom et le prénom sont nécessaires pour enregistrer le
                      pointage.
                    </p>
                  )}
                </div>

                <div className="action-grid" aria-label="Actions de pointage">
                  <button
                    type="button"
                    className="primary-action"
                    onClick={() => requestLocation('arrivee')}
                    disabled={isLoading}
                    aria-busy={isLoading}
                    data-testid="button-checkin"
                  >
                    <LogIn size={18} aria-hidden="true" />
                    {isLoading && lastAction === 'arrivee'
                      ? 'Recherche en cours'
                      : "Pointer l'arrivée"}
                  </button>
                  <button
                    type="button"
                    className="primary-action departure"
                    onClick={() => requestLocation('depart')}
                    disabled={isLoading}
                    aria-busy={isLoading}
                    data-testid="button-checkout"
                  >
                    <LogOut size={18} aria-hidden="true" />
                    {isLoading && lastAction === 'depart'
                      ? 'Recherche en cours'
                      : 'Pointer le départ'}
                  </button>
                </div>
                <p className="action-note" id="location-help">
                  <LockKeyhole size={14} aria-hidden="true" />
                  La position est demandée uniquement au moment du clic et
                  est enregistrée avec votre pointage dans l’historique.
                </p>
              </form>
            </div>
          </section>
        </div>

         <section className={`history-section ${adminToken ? 'is-unlocked' : 'is-locked'}`} aria-labelledby="history-heading">
           <div className="history-heading-row">
              <div>
               <p className="section-eyebrow">La journée, en un coup d’œil</p>
               <h2 id="history-heading" className="history-title">
                  {adminToken ? 'Historique des pointages' : 'Données administrateur'}
               </h2>
             </div>
              {adminToken && <div className="history-tools">
               <span className="history-count" data-testid="text-history-count">
                 {history.length} {history.length > 1 ? 'lignes' : 'ligne'}
               </span>
                <div className="export-actions" aria-label="Options d’export">
                  <button
                    type="button"
                    className="export-action"
                    onClick={downloadCsv}
                    disabled={history.length === 0 || isHistoryLoading}
                    data-testid="button-export-csv"
                  >
                    <Download size={15} aria-hidden="true" />
                    CSV
                  </button>
                  <button
                    type="button"
                    className="export-action"
                    onClick={downloadExcel}
                    disabled={history.length === 0 || isHistoryLoading}
                    data-testid="button-export-excel"
                  >
                    <FileSpreadsheet size={15} aria-hidden="true" />
                    Excel (.xlsx)
                  </button>
                </div>
              </div>}
           </div>

            {!adminToken ? (
              <div className="admin-lock-panel" data-testid="status-history-locked">
                <div className="lock-panel-icon" aria-hidden="true"><LockKeyhole size={21} /></div>
                <div className="lock-panel-copy">
                  <h3>Historique réservé</h3>
                  <p>Déverrouillez l’espace administrateur pour consulter les présences et exporter les données de {selectedCompany.name}.</p>
                </div>
                <form className="admin-form" onSubmit={(event) => { event.preventDefault(); unlockAdmin(); }}>
                  <label htmlFor="admin-password">Mot de passe administrateur</label>
                  <div className="admin-input-row">
                    <input id="admin-password" className={`text-input ${adminError ? 'invalid' : ''}`} type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder="Votre mot de passe" autoComplete="current-password" data-testid="input-admin-password" />
                    <button type="submit" className="dark-button" disabled={createAdminSessionMutation.isPending} data-testid="button-unlock-admin">
                      <UnlockKeyhole size={16} aria-hidden="true" /> {createAdminSessionMutation.isPending ? 'Vérification…' : 'Déverrouiller'}
                    </button>
                  </div>
                  {adminError && <p className="validation-message" role="alert" data-testid="status-admin-error">{adminError}</p>}
                  <p className="admin-hint"><KeyRound size={13} aria-hidden="true" /> Mot de passe initial de l’entreprise : admin123.</p>
                </form>
              </div>
            ) : (
              <>
                <div className="admin-toolbar">
                  <span className="admin-session"><span className="secure-dot" aria-hidden="true" /> Session administrateur active</span>
                  <button type="button" className="text-button" onClick={lockAdmin} data-testid="button-lock-admin"><LockKeyhole size={14} aria-hidden="true" /> Verrouiller</button>
                </div>
                {adminSuccess && <p className="success-message admin-success" role="status" data-testid="status-admin-success"><Check size={15} aria-hidden="true" /> {adminSuccess}</p>}
                {isHistoryLoading ? (
             <div className="empty-history" role="status">
               <span className="empty-history-icon" aria-hidden="true">
                 <History size={17} />
               </span>
               <span>Chargement de l’historique permanent…</span>
             </div>
                ) : isHistoryError ? (
             <div className="history-error" role="alert">
               <span>Impossible de charger l’historique pour le moment.</span>
               <button
                 type="button"
                 className="secondary-action"
                 onClick={() => refetchHistory()}
               >
                 <RefreshCw size={14} aria-hidden="true" />
                 Réessayer
               </button>
             </div>
                ) : history.length === 0 ? (
            <div className="empty-history" role="status" data-testid="status-history-empty">
              <span className="empty-history-icon" aria-hidden="true">
                <History size={17} />
              </span>
              <span>
                Aucun pointage pour le moment. Votre premier enregistrement
                apparaîtra ici après confirmation de la position.
              </span>
            </div>
                ) : (
            <div className="history-table-wrap">
              <table className="history-table">
                <caption className="sr-only">
                  Historique des arrivées et départs, du plus récent au plus
                  ancien
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Nom / Prénom</th>
                    <th scope="col">Action</th>
                    <th scope="col">Heure du clic</th>
                    <th scope="col">Coordonnées GPS</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr key={entry.id} data-testid={`row-history-${entry.id}`}>
                      <td className="person-cell">{entry.name}</td>
                      <td>
                        <span
                          className={`action-badge ${
                            entry.action === 'arrivee' ? 'arrival' : 'departure'
                          }`}
                          data-testid={`status-action-${entry.id}`}
                        >
                          {entry.action === 'arrivee' ? (
                            <LogIn size={13} aria-hidden="true" />
                          ) : (
                            <LogOut size={13} aria-hidden="true" />
                          )}
                          {actionNoun(entry.action)}
                        </span>
                      </td>
                      <td className="time-cell">
                         <time dateTime={entry.recordedAt}>
                           {frenchTime(new Date(entry.recordedAt))}
                        </time>
                      </td>
                       <td className="coordinates-cell">
                         <a
                           className="coordinates-link"
                           href={`https://www.google.com/maps/search/?api=1&query=${entry.latitude},${entry.longitude}`}
                           target="_blank"
                           rel="noreferrer"
                           data-testid={`link-map-${entry.id}`}
                         >
                           <MapPin size={13} aria-hidden="true" />
                           {entry.latitude.toFixed(5)}°, {entry.longitude.toFixed(5)}°
                         </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
                )}
              </>
            )}
        </section>

        <footer className="footer-row">
          <span>
            <ShieldCheck size={14} aria-hidden="true" />
            Vos informations restent confidentielles
          </span>
          <span data-testid="text-geolocation-hint">
            <Navigation size={13} aria-hidden="true" />
            Autorisation de position requise pour pointer
          </span>
          <span>
            <Clock3 size={13} aria-hidden="true" />
             Historique sauvegardé durablement
          </span>
        </footer>
      </div>
    </main>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;