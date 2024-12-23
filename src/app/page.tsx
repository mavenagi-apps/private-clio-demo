'use client';

import { useEffect } from 'react';
import { UserInfo, secureUserData } from '@/security';
import { users } from '@/users';

declare global {
  interface Window {
    Maven?: {
      ChatWidget?: {
        load: (config: {
          orgFriendlyId: string;
          agentFriendlyId: string;
          bgColor: string;
          signedUserData: string;
        }) => void;
      };
    };
  }
}

export default function Page({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined },
}) {
  const userId = searchParams?.userId as string || users[0].id;
  const user = users.find(u => u.id === userId);

  useEffect(() => {
    async function initializeMaven() {
      if (!user) return;

      try {
        const userData = await secureUserData({
          id: user.id,
          name: user.firstName + ' ' + user.lastName,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        } as Record<string, string> & UserInfo);

        const script = document.createElement('script');
        script.src = 'https://chat.onmaven.app/js/widget.js';
        script.defer = true;
        script.onload = () => {
          window.Maven?.ChatWidget?.load({
            orgFriendlyId: "clio",
            agentFriendlyId: "support",
            bgColor: "#3464DC",
            signedUserData: userData
          });
        };
        document.body.appendChild(script);

        return () => {
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
        };
      } catch (error) {
        console.error('Error initializing Maven:', error);
      }
    }

    initializeMaven();
  }, [user]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="bg-blue-600 text-white text-xs p-5">
        Logged in as: {`${user.firstName} - ${user.companyName}`}
        <br />
        Login as:&nbsp;&nbsp;
        {users.map(u => (
          <span key={u.id}>
            <a href={`/?userId=${u.id}`} className="hover:text-gray-200 underline">
              {u.firstName}
            </a>&nbsp;&nbsp;
          </span>
        ))}
      </div>
      <div 
        className="h-screen bg-cover"
        style={{
          backgroundImage: 'url(/background.jpg)'
        }}
      />
    </>
  );
}