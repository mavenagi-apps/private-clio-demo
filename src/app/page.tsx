'use client';

import { UserInfo, secureUserData } from '@/security';
import { users } from '@/users';

// Add type for Maven global object
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

export default async function Page({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined },
}) {
  const userId = searchParams?.userId as string || users[0].id;
  console.log('userId', userId);
  const user = users.find(u => u.id === userId)!;
  console.log('user', user);
  
  const userData = await secureUserData({
    id: user.id,
    name: user.firstName + ' ' + user.lastName,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  } as Record<string, string> & UserInfo);

  console.log('userData', userData);

  return (
    <>
      <div className="bg-blue-600 text-white text-xs p-5">
        Logged in as:  {`${user.firstName} - ${user.companyName}`}
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
        className="h-screen"
        style={{
          backgroundImage: 'url(/background.jpg)',
          backgroundSize: 'cover',
        }}
      >
        <script src="https://chat.onmaven.app/js/widget.js" defer />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              addEventListener("load", function () {
                Maven.ChatWidget.load({
                  orgFriendlyId: "clio",
                  agentFriendlyId: "support",
                  bgColor: "#3464DC",
                  signedUserData: "${userData}"
                })
              });
            `,
          }}
        />
      </div>
    </>
  );
}