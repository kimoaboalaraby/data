import { create } from 'zustand';
import { 
  Subscription, 
  SubscriptionTier, 
  ServiceCategory 
} from '../types';
import { generateId } from '../utils/helpers';
import { addDays, addMonths } from 'date-fns';

// Mock data
const mockSubscriptions: Subscription[] = [
  {
    id: 'sub-1',
    clientId: 'contact-1',
    clientName: 'محمد العلي',
    clientPhone: '+965 9876 5432',
    tier: 'gold',
    duration: 6, // 6 months
    startDate: '2025-01-20T00:00:00Z',
    endDate: '2025-07-20T00:00:00Z',
    totalPrice: 1500,
    status: 'active',
    emailCredentials: [
      {
        id: 'email-1',
        provider: 'Gmail',
        email: 'mohammed@gmail.com',
        password: 'securepass123'
      }
    ],
    websiteServices: [
      {
        type: 'wordpressSetup',
        price: 300
      }
    ],
    designServices: [
      {
        type: 'poster',
        platforms: ['facebook', 'instagram'],
        monthlyInstances: 4,
        price: 400
      }
    ],
    managementServices: [
      {
        type: 'socialMedia',
        platforms: ['facebook', 'instagram'],
        monthlyUpdates: 12,
        price: 500
      }
    ],
    advertisingServices: [
      {
        type: 'creation',
        platforms: ['facebook'],
        serviceFee: 100,
        budget: 200,
        price: 300
      }
    ],
    createdAt: '2025-01-20T10:00:00Z'
  },
  {
    id: 'sub-2',
    clientId: 'contact-2',
    clientName: 'فاطمة السالم',
    clientPhone: '+965 5566 7788',
    tier: 'silver',
    duration: 3, // 3 months
    startDate: '2025-02-01T00:00:00Z',
    endDate: '2025-05-01T00:00:00Z',
    totalPrice: 900,
    status: 'active',
    emailCredentials: [
      {
        id: 'email-2',
        provider: 'Google Workspace',
        email: 'fatima@elegancestore.com',
        password: 'elegance123'
      }
    ],
    designServices: [
      {
        type: 'poster',
        platforms: ['instagram', 'tiktok'],
        monthlyInstances: 6,
        price: 300
      }
    ],
    managementServices: [
      {
        type: 'socialMedia',
        platforms: ['instagram', 'tiktok'],
        monthlyUpdates: 20,
        price: 300
      }
    ],
    advertisingServices: [
      {
        type: 'management',
        platforms: ['instagram'],
        serviceFee: 150,
        budget: 150,
        price: 300
      }
    ],
    createdAt: '2025-02-01T09:30:00Z'
  }
];

type SubscriptionsState = {
  subscriptions: Subscription[];
  recycledSubscriptions: Subscription[];
  isLoading: boolean;
  error: string | null;
  
  // Subscription actions
  addSubscription: (subscription: Omit<Subscription, 'id' | 'tier' | 'createdAt'>) => string;
  updateSubscription: (subscription: Subscription) => void;
  deleteSubscription: (id: string) => void;
  restoreSubscription: (id: string, subscription: Subscription) => void;
  
  // Helper function to determine tier
  calculateTier: (categories: ServiceCategory[]) => SubscriptionTier;
  
  // Export/Import actions
  exportSubscriptions: (format: 'pdf' | 'excel' | 'json') => void;
  importSubscriptions: (data: string, format: 'excel' | 'json') => void;
};

export const useSubscriptionsStore = create<SubscriptionsState>((set, get) => ({
  subscriptions: mockSubscriptions,
  recycledSubscriptions: [],
  isLoading: false,
  error: null,
  
  addSubscription: (subscriptionData) => {
    const categories: ServiceCategory[] = [];
    
    if (subscriptionData.websiteServices && subscriptionData.websiteServices.length > 0) {
      categories.push('website');
    }
    if (subscriptionData.designServices && subscriptionData.designServices.length > 0) {
      categories.push('design');
    }
    if (subscriptionData.managementServices && subscriptionData.managementServices.length > 0) {
      categories.push('management');
    }
    if (subscriptionData.advertisingServices && subscriptionData.advertisingServices.length > 0) {
      categories.push('advertising');
    }
    
    const tier = get().calculateTier(categories);
    
    const newSubscription: Subscription = {
      id: generateId(),
      ...subscriptionData,
      tier,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    set(state => ({
      subscriptions: [...state.subscriptions, newSubscription]
    }));
    
    return newSubscription.id;
  },
  
  updateSubscription: (updatedSubscription) => {
    set(state => ({
      subscriptions: state.subscriptions.map(subscription => 
        subscription.id === updatedSubscription.id 
          ? updatedSubscription 
          : subscription
      )
    }));
  },
  
  deleteSubscription: (id) => {
    const subscription = get().subscriptions.find(s => s.id === id);
    
    if (subscription) {
      const deletedSubscription = {
        ...subscription,
        status: 'deleted' as const,
        deletedAt: new Date().toISOString()
      };
      
      set(state => ({
        subscriptions: state.subscriptions.filter(s => s.id !== id),
        recycledSubscriptions: [...state.recycledSubscriptions, deletedSubscription]
      }));
    }
  },
  
  restoreSubscription: (id, updatedSubscription) => {
    set(state => ({
      recycledSubscriptions: state.recycledSubscriptions.filter(s => s.id !== id),
      subscriptions: [...state.subscriptions, {
        ...updatedSubscription,
        status: 'active'
      }]
    }));
  },
  
  calculateTier: (categories) => {
    const uniqueCategories = [...new Set(categories)];
    
    switch (uniqueCategories.length) {
      case 4:
        return 'gold';
      case 3:
        return 'silver';
      case 2:
        return 'bronze';
      default:
        return 'regular';
    }
  },
  
  exportSubscriptions: (format) => {
    // In a real implementation, this would generate and download the file
    console.log(`Exporting all subscriptions in ${format} format`);
  },
  
  importSubscriptions: (data, format) => {
    // In a real implementation, this would parse the data and import subscriptions
    console.log(`Importing subscriptions from ${format} data`);
  }
}));