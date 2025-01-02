export interface Case {
  number: string;
  name: string;
  amount: string;
  status: string;
}

export const cases = [
  {
    number: "1",
    name: 'Acme Corp',
    amount: '$1800',
    status: 'Progress',
  },
  {
    number: "2",
    name: 'Tornado Pharma',
    amount: '$1500',
    status: 'Draft',
  },
  {
    number: "3",
    name: 'MavenAGI',
    amount: '$2000',
    status: 'Complete'
  },
]
