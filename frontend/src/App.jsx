import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(28,31,41,0.95)',
            color: '#e1e1ef',
            border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '13px',
            backdropFilter: 'blur(12px)',
          },
          success: { iconTheme: { primary: '#4cd6ff', secondary: '#001f28' } },
          error:   { iconTheme: { primary: '#ffb4ab', secondary: '#001f28' } },
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  );
}
