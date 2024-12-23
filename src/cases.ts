export interface Case {
  number: string;
  name: string;
  amount: string;
  status: string;
}

export const cases = [
  {
    number: 123,
    name: 'Acme Corp',
    amount: '$1800',
    status: 'Progress',
  },
  {
    number: 456,
    name: 'Tornado Pharma',
    amount: '$1500',
    status: 'Draft',
  },
  {
    number: 789,
    name: 'MavenAGI',
    amount: '$2000',
    status: 'Complete'
  },
]
