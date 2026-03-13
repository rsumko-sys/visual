import React from 'react';

/** Beta: без пароля — всі маршрути відкриті */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
