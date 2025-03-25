import { SearchConfig } from '../../../../services/settingsApi';

export interface ConfigureTabProps {
  searchConfig: SearchConfig;
  originalConfig: SearchConfig;
  loading: boolean;
  saveSuccess: boolean;
  saveError: string | null;
  configError: string | null;
  isConfigChanged: boolean;
  handleIdFieldChange: (value: string | null) => void;
  handleTitleFieldChange: (value: string | null) => void;
  handleImageUrlFieldChange: (value: string | null) => void;
  handleSearchableAttributesChange: (value: string[]) => void;
  handleSaveConfig: () => Promise<void>;
}

export interface PlaceholderTabProps {
  title: string;
} 