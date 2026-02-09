import {
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { logOutOutline, personCircleOutline, alertCircleOutline } from 'ionicons/icons';
import { signOut, User } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { auth } from '../firebase';
import './Map.css';

declare global {
  interface Window {
    L: any;
  }
}

type Problem = {
  id: number;
  lat: number;
  lng: number;
  nom: string;
  date: string;
  status: 'nouveau' | 'en-cours' | 'termine';
  surface: number;
  budget: number;
  entreprise: string;
  description: string;
};

const initialProblems: Problem[] = [
  {
    id: 1,
    lat: -18.8792,
    lng: 47.5079,
    nom: 'Rue de la Gare',
    date: '2025-01-15',
    status: 'nouveau',
    surface: 150,
    budget: 5000000,
    entreprise: 'BTP Madagascar',
    description: 'Nid de poule important',
  },
  {
    id: 2,
    lat: -18.91,
    lng: 47.52,
    nom: 'Avenue Andohalo',
    date: '2025-01-10',
    status: 'en-cours',
    surface: 280,
    budget: 8500000,
    entreprise: 'Routes et Travaux SA',
    description: 'Renovation de chaussee',
  },
  {
    id: 3,
    lat: -18.865,
    lng: 47.525,
    nom: 'Route Nationale 5',
    date: '2025-01-05',
    status: 'termine',
    surface: 120,
    budget: 3200000,
    entreprise: 'Construction Plus',
    description: 'Repavage termine',
  },
];

const TILE_SERVER_URL = 'http://localhost:8082';

const MapPage: React.FC<{ user: User }> = ({ user }) => {
  const history = useHistory();
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [problems, setProblems] = useState<Problem[]>(initialProblems);
  const [reportMode, setReportMode] = useState(false);
  const reportModeRef = useRef(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [formNom, setFormNom] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSurface, setFormSurface] = useState('');
  const [formBudget, setFormBudget] = useState('');
  const [formEntreprise, setFormEntreprise] = useState('');
  const [formStatus, setFormStatus] = useState<'nouveau' | 'en-cours' | 'termine'>('nouveau');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (mapRef.current || !window.L) {
      return;
    }

    const L = window.L;
    const map = L.map('map').setView([-18.8792, 47.5079], 13);
    mapRef.current = map;

    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: 'OpenStreetMap',
    });

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Esri',
      }
    );

    const offlineLayer = L.tileLayer(`${TILE_SERVER_URL}/styles/basic-preview/{z}/{x}/{y}.png`, {
      maxZoom: 19,
      attribution: 'Offline Tiles',
    });

    osmLayer.addTo(map);

    L.control.layers(
      {
        OpenStreetMap: osmLayer,
        Satellite: satelliteLayer,
        'Offline (local)': offlineLayer,
      },
      undefined,
      { position: 'topright' }
    ).addTo(map);

    L.control.scale().addTo(map);

    const markersLayer = L.featureGroup();
    markersLayer.addTo(map);
    markersLayerRef.current = markersLayer;

    map.on('click', (event: any) => {
      if (!reportModeRef.current) {
        return;
      }
      setPendingCoords({ lat: event.latlng.lat, lng: event.latlng.lng });
      setReportOpen(true);
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, []);

  useEffect(() => {
    reportModeRef.current = reportMode;
  }, [reportMode]);

  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!markersLayerRef.current || !window.L) {
      return;
    }
    const L = window.L;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    const icons = {
      nouveau: L.icon({
        iconUrl:
          'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
      'en-cours': L.icon({
        iconUrl:
          'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
      termine: L.icon({
        iconUrl:
          'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    } as const;

    problems.forEach((probleme) => {
      const marker = L.marker([probleme.lat, probleme.lng], {
        icon: icons[probleme.status],
      });
      const popupContent = `
        <div class="custom-popup">
          <h4>${probleme.nom}</h4>
          <p><strong>Probleme #${probleme.id}</strong></p>
          <p><strong>Description:</strong> ${probleme.description}</p>
          <p><strong>Date:</strong> ${probleme.date}</p>
          <p><strong>Statut:</strong> ${probleme.status.toUpperCase()}</p>
          <p><strong>Surface:</strong> ${probleme.surface} m2</p>
          <p><strong>Budget:</strong> ${probleme.budget.toLocaleString()} Ar</p>
          <p><strong>Entreprise:</strong> ${probleme.entreprise}</p>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.bindTooltip(`${probleme.nom} (${probleme.status})`);
      markersLayer.addLayer(marker);
    });
  }, [problems]);

  const totalSurface = problems.reduce((sum, p) => sum + p.surface, 0);
  const totalBudget = problems.reduce((sum, p) => sum + p.budget, 0);
  const doneCount = problems.filter((p) => p.status === 'termine').length;
  const progress = problems.length ? Math.round((doneCount / problems.length) * 100) : 0;

  const handleLogout = async () => {
    await signOut(auth);
    history.replace('/login');
  };

  const resetForm = () => {
    setFormNom('');
    setFormDescription('');
    setFormSurface('');
    setFormBudget('');
    setFormEntreprise('');
    setFormStatus('nouveau');
    setFormError('');
  };

  const handleSubmitReport = () => {
    if (!pendingCoords) {
      setFormError('Touchez la carte pour choisir un emplacement.');
      return;
    }
    if (!formNom || !formDescription) {
      setFormError('Veuillez renseigner un lieu et une description.');
      return;
    }

    const newId = problems.length ? Math.max(...problems.map((p) => p.id)) + 1 : 1;
    const date = new Date().toISOString().slice(0, 10);
    const newProblem: Problem = {
      id: newId,
      lat: pendingCoords.lat,
      lng: pendingCoords.lng,
      nom: formNom,
      date,
      status: formStatus,
      surface: Number(formSurface) || 0,
      budget: Number(formBudget) || 0,
      entreprise: formEntreprise || 'Non specifie',
      description: formDescription,
    };

    setProblems((prev) => [...prev, newProblem]);
    setReportOpen(false);
    setReportMode(false);
    setPendingCoords(null);
    resetForm();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Bienvenue {user.email ?? ''}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/profile')}>
              <IonIcon slot="start" icon={personCircleOutline} />
              Profil
            </IonButton>
            <IonButton color="danger" onClick={handleLogout}>
              <IonIcon slot="start" icon={logOutOutline} />
              Deconnexion
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="map-content">
        <div className="stats-panel">
          <div>
            <strong>Nombre de points:</strong> {problems.length}
          </div>
          <div>
            <strong>Surface totale:</strong> {totalSurface.toLocaleString()} m2
          </div>
          <div>
            <strong>Avancement:</strong> {progress}%
          </div>
          <div>
            <strong>Budget total:</strong> {totalBudget.toLocaleString()} Ar
          </div>
        </div>

        <div id="map" />

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setReportMode((prev) => !prev)}>
            <IonIcon icon={alertCircleOutline} />
          </IonFabButton>
        </IonFab>

        {reportMode && (
          <div className="report-hint">
            Touchez la carte pour choisir un emplacement
          </div>
        )}

        <IonModal isOpen={reportOpen} onDidDismiss={() => setReportOpen(false)}>
          <IonPage>
            <IonHeader>
              <IonToolbar>
                <IonTitle>Signaler un probleme</IonTitle>
                <IonButtons slot="end">
                  <IonButton onClick={() => setReportOpen(false)}>Fermer</IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
              <IonItem>
                <IonLabel position="stacked">Lieu</IonLabel>
                <IonInput value={formNom} onIonInput={(e) => setFormNom(e.detail.value ?? '')} />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Description</IonLabel>
                <IonTextarea
                  value={formDescription}
                  onIonInput={(e) => setFormDescription(e.detail.value ?? '')}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Surface (m2)</IonLabel>
                <IonInput
                  value={formSurface}
                  type="number"
                  onIonInput={(e) => setFormSurface(e.detail.value ?? '')}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Budget (Ar)</IonLabel>
                <IonInput
                  value={formBudget}
                  type="number"
                  onIonInput={(e) => setFormBudget(e.detail.value ?? '')}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Entreprise</IonLabel>
                <IonInput value={formEntreprise} onIonInput={(e) => setFormEntreprise(e.detail.value ?? '')} />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Statut</IonLabel>
                <IonSelect value={formStatus} onIonChange={(e) => setFormStatus(e.detail.value)}>
                  <IonSelectOption value="nouveau">Nouveau</IonSelectOption>
                  <IonSelectOption value="en-cours">En-cours</IonSelectOption>
                  <IonSelectOption value="termine">Termine</IonSelectOption>
                </IonSelect>
              </IonItem>

              {formError && (
                <p style={{ color: '#d32f2f', marginTop: '12px' }}>{formError}</p>
              )}

              <IonButton expand="block" onClick={handleSubmitReport} style={{ marginTop: '12px' }}>
                Enregistrer
              </IonButton>
              <IonButton
                expand="block"
                fill="clear"
                onClick={() => {
                  setReportOpen(false);
                  setReportMode(false);
                  setPendingCoords(null);
                  resetForm();
                }}
              >
                Annuler
              </IonButton>
            </IonContent>
          </IonPage>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default MapPage;
