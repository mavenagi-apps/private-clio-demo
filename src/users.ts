import {Case, cases} from "@/cases";

export interface Location {
  country: string;
}


export interface User {
  id: string;
  firstName: string;
  lastName: string;
  userType: string;
  email: string;
  companyName: string;
  products: string[];
  memberSince: string;
}


export const users = [
  {
    id: '112',
    firstName: 'Justin',
    lastName: 'Wright',
    userType: 'Admin',
    email: 'justin@biglawfirm.com',
    companyName: "Big Law Firm",
    products: ["Clio Manage", "Clio Grow"],
    memberSince: '2022-01-31',
  },
  {
    id: '52',
    firstName: 'Rustom',
    lastName: 'Birdie',
    userType: 'Employee',
    email: 'rustom@biglawfirm.com',
    companyName: "Big Law Firm",
    products: ["Clio Grow", "Clio Draft"],
    memberSince: '2024-07-15',
  },
] as User[];
