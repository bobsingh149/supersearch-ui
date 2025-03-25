import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Organization {
  id: number;
  name: string;
  current: boolean;
}

interface OrganizationStore {
  organizations: Organization[];
  initialized: boolean;
  setCurrentOrganization: (orgId: number) => void;
  initializeStore: () => void;
}

const defaultOrganizations = [
  { id: 1, name: "Acme Corp", current: true },
  { id: 2, name: "Stark Industries", current: false },
  { id: 3, name: "Wayne Enterprises", current: false },
];

const useOrganizationStore = create<OrganizationStore>()(
  persist(
    (set) => ({
      organizations: defaultOrganizations,
      initialized: false,
      setCurrentOrganization: (orgId) => 
        set((state) => ({
          organizations: state.organizations.map(org => ({
            ...org,
            current: org.id === orgId
          }))
        })),
      initializeStore: () =>
        set((state) => {
          if (state.initialized || state.organizations.some(org => org.current)) {
            return { initialized: true };
          }
          return {
            initialized: true,
            organizations: state.organizations.map((org, index) => ({
              ...org,
              current: index === 0
            }))
          };
        }),
    }),
    {
      name: 'organization-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useOrganizationStore; 