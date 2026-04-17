import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAxios, refreshAccessToken } from '../utils/Auth';

const AuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 300));

        await refreshAccessToken();

        const response = await authAxios.get(`${apiUrl}/api/me`);

        const user = response.data;

        if (!user) {
          throw new Error('Brak danych użytkownika');
        }

        console.log('Zalogowano pomyślnie:', user);

        navigate('/home', { replace: true });

      } catch (error) {
        console.error('Błąd podczas logowania: ', error);
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, apiUrl]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Trwa logowanie za pomocą sociali...
      </div>
    );
  }

  return null;
};

export default AuthCallback;