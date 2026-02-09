import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, IonSpinner, IonContent, IonPage, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from './firebase';
import Login from './pages/Login';
import Register from './pages/Register';
import MapPage from './pages/Map';
import Profile from './pages/Profile';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    return (
      <IonApp>
        <IonPage>
          <IonContent className="ion-padding" fullscreen>
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <IonSpinner name="crescent" />
            </div>
          </IonContent>
        </IonPage>
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/login">
            {user ? <Redirect to="/map" /> : <Login />}
          </Route>
          <Route exact path="/register">
            {user ? <Redirect to="/map" /> : <Register />}
          </Route>
          <Route exact path="/map">
            {user ? <MapPage user={user} /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/profile">
            {user ? <Profile user={user} /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/">
            <Redirect to={user ? '/map' : '/login'} />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
