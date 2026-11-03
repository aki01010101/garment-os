import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installCameraGuardian, stopAllCameraHardware } from './utils/cameraManager';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Install hardware camera stream tracker and ensure hardware shutoff on page exit
installCameraGuardian();
window.addEventListener('beforeunload', stopAllCameraHardware);
window.addEventListener('pagehide', stopAllCameraHardware);

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
