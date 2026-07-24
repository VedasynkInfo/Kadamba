import { listTemplates, getTemplate, createTemplate, updateTemplate, archiveTemplate, seedTemplates } from './measurementTemplateService';
import { listProfiles, getProfile, createProfile, updateProfile, archiveProfile, duplicateProfile, getProfileHistory, seedProfiles } from './measurementProfileService';

// Re-export all services
export {
  // Template services
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  archiveTemplate,
  seedTemplates,

  // Profile services
  listProfiles,
  getProfile,
  createProfile,
  updateProfile,
  archiveProfile,
  duplicateProfile,
  getProfileHistory,
  seedProfiles,
};