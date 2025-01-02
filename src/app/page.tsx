import {UserInfo, secureUserData} from '@/security';
import { users } from '@/users';

export default async function Page({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined },
}) {
  const userId = searchParams?.userId as string || "112";
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
        style={{
          backgroundImage: 'url(/background.jpg)',
          backgroundSize: 'cover',
          height: '100vh'
        }}
      >
        <script src="https://chatbot.onmaven.app/widget.js" defer></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              addEventListener("load", function () {
                Maven.ChatWidget.load({
                  organizationId: "clio",
                  agentId: "support",
                  bgColor: "#3464DC",
                  signedUserData: "${userData}"
                })
              });
            `
          }}
        ></script>
      </div>
    </>
  );
}