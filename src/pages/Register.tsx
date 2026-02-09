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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { auth } from '../firebase';

const Register: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    if (!email || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      history.replace('/map');
    } catch (err: any) {
      setError(err?.message ?? "Impossible de creer le compte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Inscription</IonTitle>
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
        <IonItem>
          <IonLabel position="stacked">Confirmer le mot de passe</IonLabel>
          <IonInput
            value={confirmPassword}
            type="password"
            onIonInput={(e) => setConfirmPassword(e.detail.value ?? '')}
            placeholder="••••••••"
          />
        </IonItem>

        {error && (
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        )}

        <IonButton expand="block" onClick={handleRegister} disabled={loading}>
          Creer un compte
        </IonButton>
        <IonButton expand="block" fill="clear" onClick={() => history.push('/login')}>
          Deja un compte ? Connecte-toi
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Register;
