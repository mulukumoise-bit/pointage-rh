import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, query, getDocs, where, setDoc, doc, deleteDoc } from 'firebase/firestore';

interface EnregistrementPointage {
  id: string;
  nomSalarie: string;
  structure: string;
  mode: 'Arrivée' | 'Départ';
  horaire: string;
  dateJour: string;
  coordonneesGps: string;
  statutZone: boolean;
  cartographieMetres: number;
}

interface StructureItem {
  id: string;
  nom: string;
  dateExpiration?: number;
}

export default function PointageCloudPortal() {
  const WHATSAPP_HOTLINE = "2435473958";
  
  const LAT_Cible = -11.6609;
  const LNG_Cible = 27.4794;
  const RAYON_LIMITE = 100;

  const CLES_PASS = [
    'RH2026-A1X9', 'RH2026-B0Z2', 'RH2026-C3M7', 'RH2026-D4K0', 'RH2026-E9P5'
  ];

  const [vueActive, setVueActive] = useState<'principal' | 'gestion' | 'support'>('principal');
  const [structuresList, setStructuresList] = useState<StructureItem[]>([]);
  const [structureSelectionnee, setStructureSelectionnee] = useState<string>('');
  const [nouvelleStructInput, setNouvelleStructInput] = useState('');

  const [salarieNom, setSalarieNom] = useState('');
  const [passAdmin, setPassAdmin] = useState('');
  const [estAdminValide, setEstAdminValide] = useState(false);
  const [erreurAdminMsg, setErreurAdminMsg] = useState('');

  const [expirationTemps, setExpirationTemps] = useState<number>(() => {
    const localExp = localStorage.getItem('prh_expiration');
    return localExp ? parseInt(localExp, 10) : Date.now() + (30 * 24 * 60 * 60 * 1000);
  });
  const [codeRechargeSaisi, setCodeRechargeSaisi] = useState('');

  const [journalierList, setJournalierList] = useState<EnregistrementPointage[]>([]);
  const [popupInfo, setPopupInfo] = useState<{ active: boolean; titre: string; texte: string }>({
    active: false, titre: '', texte: ''
  });
  const [confirmationSuppression, setConfirmationSuppression] = useState(false);
  const [patienter, setPatienter] = useState(false);

  useEffect(() => {
    const parametresUrl = new URLSearchParams(window.location.search);
    const structUrl = parametresUrl.get('entreprise');

    if (structUrl) {
      setStructureSelectionnee(structUrl);
      localStorage.setItem('prh_entreprise', structUrl);
    } else {
      const savedStruct = localStorage.getItem('prh_entreprise');
      if (savedStruct) setStructureSelectionnee(savedStruct);
    }
  }, []);

  useEffect(() => {
    const fluxReq = query(collection(db, 'entreprises'));
    const desabonnerFlux = onSnapshot(fluxReq, (snapshot) => {
      const elements: StructureItem[] = snapshot.docs.map(docRef => ({
        id: docRef.id,
        nom: docRef.data().nom,
        dateExpiration: docRef.data().dateExpiration
      }));
      setStructuresList(elements);
    });
    return () => desabonnerFlux();
  }, []);

  useEffect(() => {
    if (!structureSelectionnee) return;

    const fluxPt = query(
      collection(db, 'pointages'),
      where('entreprise', '==', structureSelectionnee)
    );
    const desabonnerPt = onSnapshot(fluxPt, (snapshot) => {
      const elementsPt: EnregistrementPointage[] = snapshot.docs.map(docRef => {
        const dataDoc = docRef.data();
        return {
          id: docRef.id,
          nomSalarie: dataDoc.nom || '',
          structure: dataDoc.entreprise || '',
          mode: dataDoc.type || 'Arrivée',
          horaire: dataDoc.heure || '',
          dateJour: dataDoc.date || '',
          coordonneesGps: dataDoc.gps || '',
          statutZone: dataDoc.estDansLaZone ?? true,
          cartographieMetres: dataDoc.distanceMetres ?? 0
        };
      });

      elementsPt.sort((a, b) => b.id.localeCompare(a.id));
      setJournalierList(elementsPt);
    });

    return () => desabonnerPt();
  }, [structureSelectionnee]);

  const declencherNotification = (titre: string, texte: string) => {
    setPopupInfo({ active: true, titre, texte });
  };

  const evaluerDistanceGps = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const rayonTerre = 6371e3;
    const diffLat = (lat2 - lat1) * Math.PI / 180;
    const diffLon = (lon2 - lon1) * Math.PI / 180;
    const calculA = Math.sin(diffLat / 2) * Math.sin(diffLat / 2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(diffLon / 2) * Math.sin(diffLon / 2);
    const calculC = 2 * Math.atan2(Math.sqrt(calculA), Math.sqrt(1 - calculA));
    return Math.round(rayonTerre * calculC);
  };

  const creerStructureCloud = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomNettoye = nouvelleStructInput.trim();
    if (!nomNettoye) return;

    try {
      await setDoc(doc(db, 'entreprises', nomNettoye), { 
        nom: nomNettoye, 
        dateCreation: new Date(),
        dateExpiration: Date.now() + (30 * 24 * 60 * 60 * 1000)
      });
      setStructureSelectionnee(nomNettoye);
      localStorage.setItem('prh_entreprise', nomNettoye);
      setNouvelleStructInput('');
      declencherNotification('Succès', `La structure "${nomNettoye}
                                                             
