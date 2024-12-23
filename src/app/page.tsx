import { UserInfo, secureUserData } from '@/security';
import { users } from '@/users';
import Script from 'next/script';

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
      >
        <Script src="https://chat.onmaven.app/js/widget.js" strategy="afterInteractive" />
        <Script id="maven-config" strategy="afterInteractive">
          {`
            window.addEventListener('load', function() {
              setTimeout(() => {
                if (typeof Maven !== 'undefined' && Maven.ChatWidget) {
                  Maven.ChatWidget.load({
                    orgFriendlyId: "clio",
                    agentFriendlyId: "support",
                    bgColor: "#3464DC",
                    signedUserData: "${userData}"
                  });
                }
              }, 1000);
            });
          `}
        </Script>
      </div>
    </>
  );
}