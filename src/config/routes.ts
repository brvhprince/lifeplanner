const routes = {
    home: '/',
    setup: '/setup',
    signIn: '/auth/sign-in',
    twoFactor: '/auth/two-factor',
    accounts: '/accounts',
    account: (id: string) => `/accounts/${id}`,
    transactions: '/transactions',
    transaction: (id: string) => `/transactions/${id}`,
    categories: '/categories',
    settings: '/settings',
};
export default routes;
