import {Case, cases} from "@/cases";


export interface User {
  id: string;
  firstName: string;
  lastName: string;
  userType: string;
  email: string;
  companyName: string;
  products: string;
  memberSince: string;
  lastNPS: string;
  status: string;
  opportunity: string;
}


export const users = [
  {
    id: '112',
    firstName: 'Matt',
    lastName: 'Bigelow',
    userType: 'Admin',
    email: 'matt@biglawfirm.com',
    companyName: "Big Law Firm",
    products: "Clio Manage",
    memberSince: '2021-01-31',
    lastNPS: "83",
    status: "Paid",
    opportunity: "ProServe",
  },
  {
    id: '52',
    firstName: 'Rustom',
    lastName: 'Birdie',
    userType: 'Employee',
    email: 'rustom@biglawfirm.com',
    companyName: "Big Law Firm",
    products: "Clio Grow",
    memberSince: '2022-07-15',
    lastNPS: "68",
    status: "Past Due",
    opportunity: "None",
  },
] as User[];
