import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installCameraGuardian, stopAllCameraHardware } from './utils/cameraManager';

// Install hardware camera stream tracker and ensure hardware shutoff on page exit
installCameraGuardian();
window.addEventListener('beforeunload', stopAllCameraHardware);
window.addEventListener('pagehide', stopAllCameraHardware);

createRoot(document.getElementById('root')!).render(<App />);
