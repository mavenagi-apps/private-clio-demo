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
    memberSince: '2022-01-31',
  },
  {
    id: '52',
    firstName: 'Rustom',
    lastName: 'Birdie',
    userType: 'Employee',
    email: 'rustom@biglawfirm.com',
    companyName: "Big Law Firm",
    products: "Clio Grow",
    memberSince: '2024-07-15',
  },
] as User[];
