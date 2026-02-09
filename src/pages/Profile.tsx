import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { User } from 'firebase/auth';
import { useHistory } from 'react-router-dom';

const Profile: React.FC<{ user: User }> = ({ user }) => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profil</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
          <IonItem>
            <IonLabel>Email</IonLabel>
            <strong>{user.email ?? '-'}</strong>
          </IonItem>
          <IonItem>
            <IonLabel>UID</IonLabel>
            <strong>{user.uid}</strong>
          </IonItem>
        </IonList>
        <IonButton expand="block" onClick={() => history.goBack()}>
          Retour
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
