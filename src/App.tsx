    try {
      await setDoc(doc(db, 'entreprises', nomNettoye), { 
        nom: nomNettoye, 
        dateCreation: new Date(),
        dateExpiration: Date.now() + (30 * 24 * 60 * 60 * 1000)
      });
      setStructureSelectionnee(nomNettoye);
      localStorage.setItem('prh_entreprise', nomNettoye);
      setNouvelleStructInput('');
      declencherNotification('Succès', `La structure "${nomNettoye}" est enregistrée.`);
    } catch {
      declencherNotification('Erreur', 'Impossible de créer la structure.');
    }
  };

  const executerPointageAgent = (modeType: 'Arrivée' | 'Départ') => {
    if (!structureSelectionnee) {
      declencherNotification('Attention', 'Veuillez sélectionner une entreprise.');
      return;
    }
    if (!salarieNom.trim()) {
      declencherNotification('Attention', 'Veuillez saisir votre Nom et Prénom.');
      return;
    }

    if (Date.now() > expirationTemps) {
      declencherNotification('Expiré', 'Abonnement expiré. Rendez-vous dans l\'onglet Service.');
      return;
    }

    setPatienter(true);
    let actionFaite = false;

    const stockerCloud = async (latVal?: number, lngVal?: number) => {
      if (actionFaite) return;
      actionFaite = true;

      let zoneValide = true;
      let distanceCalc = 0;
      let gpsTexte = "GPS non disponible";

      if (latVal !== undefined && lngVal !== undefined) {
        distanceCalc = evaluerDistanceGps(latVal, lngVal, LAT_Cible, LNG_Cible);
        zoneValide = distanceCalc <= RAYON_LIMITE;
        gpsTexte = `${latVal.toFixed(4)}, ${lngVal.toFixed(4)}`;
      }

      const dActuelle = new Date();
      const dateFormatee = dActuelle.toLocaleDateString('fr-FR');
      const heureFormatee = dActuelle.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      try {
        await addDoc(collection(db, 'pointages'), {
          nom: salarieNom.trim(),
          entreprise: structureSelectionnee,
          type: modeType,
          heure: heureFormatee,
          date: dateFormatee,
          gps: gpsTexte,
          estDansLaZone: zoneValide,
          distanceMetres: distanceCalc
        });

        const memoNom = salarieNom;
        setSalarieNom('');
        setPatienter(false);
        declencherNotification('Validé', `Pointage d'${modeType} enregistré pour ${memoNom}.`);
      } catch {
        setPatienter(false);
        declencherNotification('Erreur', 'Échec de l\'enregistrement cloud.');
      }
    };

    const securiteDelai = setTimeout(() => {
      stockerCloud();
    }, 3000);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(securiteDelai);
          stockerCloud(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          clearTimeout(securiteDelai);
          stockerCloud();
        },
        { timeout: 2500, enableHighAccuracy: true }
      );
    } else {
      clearTimeout(securiteDelai);
      stockerCloud();
    }
  };

  const verifierPassRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    const tokenClean = codeRechargeSaisi.trim().toUpperCase();

    if (CLES_PASS.includes(tokenClean)) {
      const nouvelleExp = Date.now() + (30 * 24 * 60 * 60 * 1000);
      setExpirationTemps(nouvelleExp);
      localStorage.setItem('prh_expiration', nouvelleExp.toString());
      setCodeRechargeSaisi('');
      declencherNotification('Activé', 'Abonnement prolongé de 30 jours avec succès !');
    } else {
      declencherNotification('Invalide', 'Le code de recharge est incorrect.');
    }
  };

  const partagerLienEmploye = () => {
    const lienPortal = `${window.location.origin}?entreprise=${encodeURIComponent(structureSelectionnee)}`;
    navigator.clipboard.writeText(lienPortal);
    declencherNotification('Copié', 'Le lien d\'accès employé a été copié.');
  };

  const exporterRapportTexte = () => {
    if (journalierList.length === 0) {
      declencherNotification('Vide', 'Aucun pointage à exporter.');
      return;
    }
    let contenu = `📊 RAPPORT - ${structureSelectionnee}\n\n`;
    journalierList.forEach((item, index) => {
      contenu += `${index + 1}. ${item.nomSalarie} [${item.mode}] - ${item.dateJour} à ${item.horaire}\n`;
    });
    navigator.clipboard.writeText(contenu);
    declencherNotification('Copié', 'Rapport copié dans le presse-papier.');
  };

  const viderRegistreCloud = async () => {
    try {
      const fluxVider = query(collection(db, 'pointages'), where('entreprise', '==', structureSelectionnee));
      const snapVider = await getDocs(fluxVider);
      const tachesSuppression = snapVider.docs.map(docRef => deleteDoc(docRef.ref));
      await Promise.all(tachesSuppression);

      setConfirmationSuppression(false);
      declencherNotification('Effacé', 'L\'historique a été réinitialisé.');
    } catch {
      setConfirmationSuppression(false);
      declencherNotification('Erreur', 'Impossible de vider l\'historique.');
    }
  };

  const decompteJours = Math.max(0, Math.ceil((expirationTemps - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'sans-serif' }}>
      <header style={{ backgroundColor: '#0f172a', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px' }}>Pointage-RH</h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>{structureSelectionnee || 'Sélectionnez une entreprise'}</p>
        </div>
        <div style={{ backgroundColor: '#16a34a', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
          {decompteJours}j restants
        </div>
      </header>

      <div style={{ display: 'flex', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <button onClick={() => setVueActive('principal')} style={{ flex: 1, padding: '12px', border: 'none', background: 'none', fontWeight: 'bold', color: vueActive === 'principal' ? '#2563eb' : '#64748b', borderBottom: vueActive === 'principal' ? '2px solid #2563eb' : 'none', cursor: 'pointer' }}>Pointage</button>
        <button onClick={() => setVueActive('gestion')} style={{ flex: 1, padding: '12px', border: 'none', background: 'none', fontWeight: 'bold', color: vueActive === 'gestion' ? '#2563eb' : '#64748b', borderBottom: vueActive === 'gestion' ? '2px solid #2563eb' : 'none', cursor: 'pointer' }}>Admin</button>
        <button onClick={() => setVueActive('support')} style={{ flex: 1, padding: '12px', border: 'none', background: 'none', fontWeight: 'bold', color: vueActive === 'support' ? '#2563eb' : '#64748b', borderBottom: vueActive === 'support' ? '2px solid #2563eb' : 'none', cursor: 'pointer' }}>Service</button>
      </div>

      <main style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
        {vueActive === 'principal' && (
          <div>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Mon Entreprise :</label>
              <select value={structureSelectionnee} onChange={(e) => { setStructureSelectionnee(e.target.value); localStorage.setItem('prh_entreprise', e.target.value); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <option value="">-- Choisir une entreprise --</option>
                {structuresList.map((item) => (
                  <option key={item.id} value={item.nom}>{item.nom}</option>
                ))}
              </select>
            </div>

            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '16px', marginTop: 0 }}>Effectuer un pointage</h2>
              <input type="text" placeholder="Entrez votre Nom & Prénom" value={salarieNom} onChange={(e) => setSalarieNom(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" disabled={patienter} onClick={() => executerPointageAgent('Arrivée')} style={{ flex: 1, padding: '14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: patienter ? 0.6 : 1 }}>
                  {patienter ? '...' : 'ARRIVÉE'}
                </button>
                <button type="button" disabled={patienter} onClick={() => executerPointageAgent('Départ')} style={{ flex: 1, padding: '14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: patienter ? 0.6 : 1 }}>
                  {patienter ? '...' : 'DÉPART'}
                </button>
              </div>
            </div>

            {structureSelectionnee && (
              <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '14px', marginTop: 0, color: '#64748b' }}>Derniers pointages</h3>
                {journalierList.length === 0 ? <p style={{ fontSize: '13px', color: '#94a3b8' }}>Aucun enregistrement pour le moment.</p> : (
                  journalierList.slice(0, 5).map(item => (
                    <div key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{item.nomSalarie}</strong> <span style={{ fontSize: '12px', color: '#64748b' }}>({item.mode})</span>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.dateJour} - {item.horaire}</div>
                      </div>
                      <span style={{ fontSize: '11px', color: item.statutZone ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                        {item.statutZone ? '🟢 OK' : '🔴 Hors zone'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {vueActive === 'gestion' && (
          <div>
            {!estAdminValide ? (
              <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '16px', marginTop: 0 }}>Connexion Admin</h2>
                <form onSubmit={(e) => { e.preventDefault(); passAdmin === 'admin123' ? setEstAdminValide(true) : setErreurAdminMsg('Code incorrect (admin123)'); }}>
                  <input type="password" placeholder="Code admin" value={passAdmin} onChange={(e) => setPassAdmin(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px', boxSizing: 'border-box' }} />
                  {erreurAdminMsg && <p style={{ color: 'red', fontSize: '12px' }}>{erreurAdminMsg}</p>}
                  <button type="submit" style={{ width: '100%', padding: '10px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Se connecter</button>
                </form>
              </div>
            ) : (
              <div>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '14px', marginTop: 0 }}>Ajouter une entreprise</h3>
                  <form onSubmit={creerStructureCloud} style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" placeholder="Nom de l'entreprise" value={nouvelleStructInput} onChange={(e) => setNouvelleStructInput(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    <button type="submit" style={{ padding: '8px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Créer</button>
                  </form>
                </div>

                {structureSelectionnee && (
                  <div>
                    <button type="button" onClick={partagerLienEmploye} style={{ width: '100%', padding: '12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginBottom: '10px', cursor: 'pointer' }}>🔗 Copier le lien employés</button>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="button" onClick={exporterRapportTexte} style={{ flex: 1, padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>📋 Rapport</button>
                      <button type="button" onClick={() => setConfirmationSuppression(true)} style={{ flex: 1, padding: '10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>🗑️ Vider</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {vueActive === 'support' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '16px', marginTop: 0 }}>Support & Activation</h2>
              <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px' }}>Contactez le support technique pour vos codes d'activation :</p>
              
              <a
                href={`https://wa.me/${WHATSAPP_HOTLINE}?text=${encodeURIComponent('Bonjour, je souhaite renouveler mon abonnement Pointage-RH.')}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  backgroundColor: '#25D366',
                  color: '#ffffff',
                  padding: '14px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '15px'
                }}
              >
                💬 WhatsApp (+243 {WHATSAPP_HOTLINE})
              </a>
            </div>

            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '16px', marginTop: 0 }}>Entrer un code de recharge</h3>
              <form onSubmit={verifierPassRecharge} style={{ marginTop: '12px' }}>
                <input type="text" placeholder="Code (ex: RH2026-A1X9)" value={codeRechargeSaisi} onChange={(e) => setCodeRechargeSaisi(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px', boxSizing: 'border-box' }} />
                <button type="submit" style={{ width: '100%', padding: '10px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Activer</button>
              </form>
            </div>
          </div>
        )}
      </main>

      {confirmationSuppression && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', maxWidth: '300px', width: '100%' }}>
            <h3 style={{ marginTop: 0, color: '#dc2626' }}>Vider l'historique ?</h3>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button type="button" onClick={() => setConfirmationSuppression(false)} style={{ flex: 1, padding: '10px', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Annuler</button>
              <button type="button" onClick={viderRegistreCloud} style={{ flex: 1, padding: '10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {popupInfo.active && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', maxWidth: '300px', width: '100%' }}>
            <h3 style={{ marginTop: 0 }}>{popupInfo.titre}</h3>
            <p style={{ fontSize: '13px', color: '#475569', whiteSpace: 'pre-line' }}>{popupInfo.texte}</p>
            <button type="button" onClick={() => setPopupInfo({ ...popupInfo, active: false })} style={{ width: '100%', padding: '10px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
            }
    
