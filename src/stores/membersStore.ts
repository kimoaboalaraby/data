import { create } from 'zustand';
import { Folder, Contact } from '../types';
import { generateId } from '../utils/helpers';

// Mock initial data
const initialFolders: Folder[] = [
  {
    id: 'folder-1',
    name: 'عملاء المواقع الإلكترونية',
    contacts: [
      {
        id: 'contact-1',
        phoneNumber: '+965 9876 5432',
        companyName: 'شركة التقنية المتطورة',
        personalName: 'محمد العلي',
        nationality: 'كويتي',
        socialMedia: {
          facebook: 'https://facebook.com/techadvanced',
          instagram: 'https://instagram.com/techadvanced',
        },
        createdAt: '2025-01-15T10:30:00Z'
      }
    ],
    createdAt: '2025-01-15T10:00:00Z'
  },
  {
    id: 'folder-2',
    name: 'عملاء التصميم',
    contacts: [
      {
        id: 'contact-2',
        phoneNumber: '+965 5566 7788',
        companyName: 'متجر الأناقة',
        personalName: 'فاطمة السالم',
        nationality: 'كويتية',
        socialMedia: {
          instagram: 'https://instagram.com/elegancestore',
          tiktok: 'https://tiktok.com/@elegancestore',
        },
        createdAt: '2025-01-20T14:15:00Z'
      }
    ],
    createdAt: '2025-01-20T14:00:00Z'
  }
];

type MembersState = {
  folders: Folder[];
  isLoading: boolean;
  error: string | null;
  
  // Folder actions
  addFolder: (name: string) => void;
  updateFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  
  // Contact actions
  addContact: (folderId: string, contact: Omit<Contact, 'id' | 'createdAt'>) => void;
  updateContact: (folderId: string, contact: Contact) => void;
  deleteContact: (folderId: string, contactId: string) => void;
  
  // Export actions
  exportFolder: (folderId: string, format: 'pdf' | 'excel' | 'image' | 'json') => void;
  exportAllFolders: (format: 'pdf' | 'excel' | 'image' | 'json') => void;
};

export const useMembersStore = create<MembersState>((set, get) => ({
  folders: initialFolders,
  isLoading: false,
  error: null,
  
  addFolder: (name) => {
    const newFolder: Folder = {
      id: generateId(),
      name,
      contacts: [],
      createdAt: new Date().toISOString()
    };
    
    set(state => ({
      folders: [...state.folders, newFolder]
    }));
  },
  
  updateFolder: (id, name) => {
    set(state => ({
      folders: state.folders.map(folder => 
        folder.id === id ? { ...folder, name } : folder
      )
    }));
  },
  
  deleteFolder: (id) => {
    set(state => ({
      folders: state.folders.filter(folder => folder.id !== id)
    }));
  },
  
  addContact: (folderId, contactData) => {
    const newContact: Contact = {
      id: generateId(),
      ...contactData,
      createdAt: new Date().toISOString()
    };
    
    set(state => ({
      folders: state.folders.map(folder => 
        folder.id === folderId 
          ? { ...folder, contacts: [...folder.contacts, newContact] } 
          : folder
      )
    }));
  },
  
  updateContact: (folderId, updatedContact) => {
    set(state => ({
      folders: state.folders.map(folder => 
        folder.id === folderId 
          ? { 
              ...folder, 
              contacts: folder.contacts.map(contact => 
                contact.id === updatedContact.id 
                  ? updatedContact 
                  : contact
              ) 
            } 
          : folder
      )
    }));
  },
  
  deleteContact: (folderId, contactId) => {
    set(state => ({
      folders: state.folders.map(folder => 
        folder.id === folderId 
          ? { 
              ...folder, 
              contacts: folder.contacts.filter(contact => 
                contact.id !== contactId
              ) 
            } 
          : folder
      )
    }));
  },
  
  exportFolder: (folderId, format) => {
    // In a real implementation, this would generate and download the file
    // For this demo, we'll just log what would happen
    const folder = get().folders.find(f => f.id === folderId);
    console.log(`Exporting folder "${folder?.name}" in ${format} format`);
  },
  
  exportAllFolders: (format) => {
    // In a real implementation, this would generate and download the file
    console.log(`Exporting all folders in ${format} format`);
  }
}));