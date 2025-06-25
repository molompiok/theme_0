// themes/mono/components/Layout/Frame.tsx
import React, { useEffect } from 'react';
import { useGetMe } from '../../api/ReactSublymusApi';
import { useAuthStore } from '../../api/stores/AuthStore';

interface FrameProps {
  children: React.ReactNode;
}

const Frame: React.FC<FrameProps> = ({ children }) => {
  const {refetch} = useGetMe({ enabled: false, backend_target: 'api' });
  const { getUser,  setUser } = useAuthStore();
     
  useEffect(()=>{
  
      const user = getUser();
      setUser(user);
      refetch().then((d)=>{
        setUser({...user,...d.data?.user});
      })
      // getToken();
    },[])
  
  return (
    <main className="flex-grow w-full">
      {/* Le contenu principal de la page sera ici */}
      {children}
    </main>
  );
};

export default Frame;