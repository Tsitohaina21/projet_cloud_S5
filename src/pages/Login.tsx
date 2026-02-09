import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
  IonHeader,
} from '@ionic/react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { auth } from '../firebase';

const Login: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      history.replace('/map');
    } catch (err: any) {
      setError(err?.message ?? 'Connexion impossible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Connexion</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">Email</IonLabel>
          <IonInput
            value={email}
            type="email"
            onIonInput={(e) => setEmail(e.detail.value ?? '')}
            placeholder="email@example.com"
          />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Mot de passe</IonLabel>
          <IonInput
            value={password}
            type="password"
            onIonInput={(e) => setPassword(e.detail.value ?? '')}
            placeholder="••••••••"
          />
        </IonItem>

        {error && (
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        )}

        <IonButton expand="block" onClick={handleLogin} disabled={loading}>
          Se connecter
        </IonButton>
        <IonButton expand="block" fill="clear" onClick={() => history.push('/register')}>
          Pas de compte ? Inscris-toi
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Login;
