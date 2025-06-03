import React, { useState } from 'react';
import { PlusCircle, Download, Trash2, FileText, Eye, ClipboardList } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { useSubscriptionsStore } from '../../stores/subscriptionsStore';
import { useMembersStore } from '../../stores/membersStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { 
  Subscription, 
  Contact, 
  EmailCredential, 
  WebsiteService, 
  DesignService, 
  ManagementService, 
  AdvertisingService, 
  Platform,
  ServiceCategory 
} from '../../types';
import { formatCurrency, getTierBadgeColor, formatTier, isExpiringSoon } from '../../utils/helpers';
import { addMonths, format } from 'date-fns';

const SubscriptionsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription, exportSubscriptions } = useSubscriptionsStore();
  const { folders } = useMembersStore();
  const { settings } = useSettingsStore();
  
  // States for tabs, modals, and selected subscription
  const [activeTab, setActiveTab] = useState<'gold' | 'silver' | 'bronze' | 'regular'>('gold');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  
  // Filter subscriptions by tier and status
  const filteredSubscriptions = subscriptions.filter(
    sub => sub.tier === activeTab && sub.status === 'active'
  );
  
  // Form state for adding/editing subscription
  const [formData, setFormData] = useState<{
    clientId: string;
    clientName: string;
    clientPhone: string;
    duration: number;
    startDate: string;
    emailCredentials: EmailCredential[];
    websiteServices?: WebsiteService[];
    designServices?: DesignService[];
    managementServices?: ManagementService[];
    advertisingServices?: AdvertisingService[];
  }>({
    clientId: '',
    clientName: '',
    clientPhone: '',
    duration: 3,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    emailCredentials: [{ id: '1', provider: '', email: '', password: '' }],
    websiteServices: [],
    designServices: [],
    managementServices: [],
    advertisingServices: []
  });
  
  // Flatten contacts for selection
  const allContacts = folders.flatMap(folder => folder.contacts);
  
  // Handlers
  const handleOpenAddModal = () => {
    setFormData({
      clientId: '',
      clientName: '',
      clientPhone: '',
      duration: 3,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      emailCredentials: [{ id: '1', provider: '', email: '', password: '' }],
      websiteServices: [],
      designServices: [],
      managementServices: [],
      advertisingServices: []
    });
    setIsAddModalOpen(true);
  };
  
  const handleViewSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsViewModalOpen(true);
  };
  
  const handleDeleteSubscription = (id: string) => {
    // In a real app, you'd show a confirmation dialog first
    deleteSubscription(id);
  };
  
  const handleExport = (format: 'pdf' | 'excel' | 'json') => {
    exportSubscriptions(format);
    setIsExportModalOpen(false);
  };
  
  const handleClientChange = (contactId: string) => {
    const contact = allContacts.find(c => c.id === contactId);
    if (contact) {
      setFormData({
        ...formData,
        clientId: contact.id,
        clientName: contact.personalName,
        clientPhone: contact.phoneNumber
      });
    }
  };
  
  const calculateEndDate = (startDate: string, durationMonths: number) => {
    const start = new Date(startDate);
    const end = addMonths(start, durationMonths);
    return format(end, 'yyyy-MM-dd');
  };
  
  const calculateTotalPrice = () => {
    let total = 0;
    
    // Calculate website services total
    if (formData.websiteServices?.length) {
      formData.websiteServices.forEach(service => {
        total += service.price;
      });
    }
    
    // Calculate design services total
    if (formData.designServices?.length) {
      formData.designServices.forEach(service => {
        total += service.price * service.monthlyInstances * formData.duration;
      });
    }
    
    // Calculate management services total
    if (formData.managementServices?.length) {
      formData.managementServices.forEach(service => {
        total += service.price * service.monthlyUpdates * formData.duration;
      });
    }
    
    // Calculate advertising services total
    if (formData.advertisingServices?.length) {
      formData.advertisingServices.forEach(service => {
        total += service.price;
      });
    }
    
    return total;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate end date and total price
    const endDate = calculateEndDate(formData.startDate, formData.duration);
    const totalPrice = calculateTotalPrice();
    
    // Create new subscription
    const newSubscriptionId = addSubscription({
      ...formData,
      endDate,
      totalPrice
    });
    
    // Close modal
    setIsAddModalOpen(false);
    
    // In a real app, you'd generate tasks here based on the services and schedule
  };
  
  // Tab component
  const TabButton = ({ 
    tier, 
    label, 
    count 
  }: { 
    tier: 'gold' | 'silver' | 'bronze' | 'regular', 
    label: string, 
    count: number 
  }) => (
    <button
      className={`px-4 py-2.5 rounded-md text-sm font-medium ${
        activeTab === tier 
          ? 'bg-primary-100 text-primary-800' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
      onClick={() => setActiveTab(tier)}
    >
      {label} ({count})
    </button>
  );
  
  // Count subscriptions by tier
  const goldCount = subscriptions.filter(sub => sub.tier === 'gold' && sub.status === 'active').length;
  const silverCount = subscriptions.filter(sub => sub.tier === 'silver' && sub.status === 'active').length;
  const bronzeCount = subscriptions.filter(sub => sub.tier === 'bronze' && sub.status === 'active').length;
  const regularCount = subscriptions.filter(sub => sub.tier === 'regular' && sub.status === 'active').length;

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="الاشتراكات"
        subtitle="إدارة اشتراكات العملاء والخدمات"
        action={
          user?.role === 'admin' && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="btn btn-outline flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                <span>تصدير</span>
              </button>
              <button
                onClick={handleOpenAddModal}
                className="btn btn-primary flex items-center gap-1"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إضافة اشتراك</span>
              </button>
            </div>
          )
        }
      />
      
      {/* Tabs */}
      <div className="flex overflow-x-auto mb-6 pb-2 no-scrollbar">
        <div className="inline-flex rounded-md bg-gray-50 p-1 shadow-sm">
          <TabButton tier="gold" label="ذهبي" count={goldCount} />
          <TabButton tier="silver" label="فضي" count={silverCount} />
          <TabButton tier="bronze" label="برونزي" count={bronzeCount} />
          <TabButton tier="regular" label="عادي" count={regularCount} />
        </div>
      </div>
      
      {/* Subscriptions Grid */}
      {filteredSubscriptions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubscriptions.map(subscription => (
            <div 
              key={subscription.id} 
              className={`card hover:shadow-lg transition-all duration-200 ${
                isExpiringSoon(subscription.endDate) ? 'border-warning-300' : ''
              }`}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-gray-900 text-lg">{subscription.clientName}</h3>
                  <span className={`badge ${getTierBadgeColor(subscription.tier)}`}>
                    {formatTier(subscription.tier)}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{subscription.clientPhone}</p>
                
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-500">تاريخ الانتهاء:</span>
                  <span className={`font-medium ${isExpiringSoon(subscription.endDate) ? 'text-warning-600' : 'text-gray-900'}`}>
                    {new Date(subscription.endDate).toLocaleDateString('ar-KW')}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-500">إجمالي الاشتراك:</span>
                  <span className="font-medium text-primary-600">{formatCurrency(subscription.totalPrice)}</span>
                </div>
                
                <div className="pt-3 border-t border-gray-200 flex gap-2">
                  <button
                    onClick={() => handleViewSubscription(subscription)}
                    className="btn btn-outline flex-1 text-sm"
                  >
                    <Eye className="w-4 h-4 ml-1" />
                    عرض
                  </button>
                  
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => handleDeleteSubscription(subscription.id)}
                      className="btn btn-outline text-error-600 border-error-300 hover:bg-error-50 flex-1 text-sm"
                    >
                      <Trash2 className="w-4 h-4 ml-1" />
                      حذف
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={`لا توجد اشتراكات ${formatTier(activeTab)}`}
          description="لم يتم العثور على اشتراكات في هذه الفئة"
          icon={<ClipboardList className="w-6 h-6" />}
          action={
            user?.role === 'admin' && (
              <button
                onClick={handleOpenAddModal}
                className="btn btn-primary"
              >
                إنشاء اشتراك جديد
              </button>
            )
          }
        />
      )}
      
      {/* Add Subscription Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="إضافة اشتراك جديد"
        footer={
          <>
            <button 
              type="button"
              className="btn btn-outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              إلغاء
            </button>
            <button
              type="submit"
              form="subscription-form"
              className="btn btn-primary"
            >
              إضافة اشتراك
            </button>
          </>
        }
      >
        <form id="subscription-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Client Selection */}
          <div>
            <label htmlFor="client" className="form-label">
              العميل <span className="text-error-500">*</span>
            </label>
            <select
              id="client"
              className="form-input"
              value={formData.clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              required
            >
              <option value="">اختر عميلاً...</option>
              {allContacts.map(contact => (
                <option key={contact.id} value={contact.id}>
                  {contact.personalName} - {contact.phoneNumber}
                </option>
              ))}
            </select>
          </div>
          
          {/* Subscription Duration */}
          <div>
            <label htmlFor="duration" className="form-label">
              مدة الاشتراك <span className="text-error-500">*</span>
            </label>
            <select
              id="duration"
              className="form-input"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              required
            >
              <option value="1">1 شهر</option>
              <option value="3">3 أشهر</option>
              <option value="6">6 أشهر</option>
              <option value="12">12 شهر</option>
            </select>
          </div>
          
          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="form-label">
              تاريخ البدء <span className="text-error-500">*</span>
            </label>
            <input
              id="startDate"
              type="date"
              className="form-input"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>
          
          {/* Email Credentials */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">بيانات اعتماد البريد الإلكتروني</h4>
            
            {formData.emailCredentials.map((credential, index) => (
              <div key={credential.id} className="space-y-3 mb-4">
                <div>
                  <label htmlFor={`provider-${index}`} className="form-label">
                    مزود الخدمة
                  </label>
                  <input
                    id={`provider-${index}`}
                    type="text"
                    className="form-input"
                    placeholder="مثال: Gmail، Google Workspace"
                    value={credential.provider}
                    onChange={(e) => {
                      const updatedCredentials = [...formData.emailCredentials];
                      updatedCredentials[index].provider = e.target.value;
                      setFormData({ ...formData, emailCredentials: updatedCredentials });
                    }}
                  />
                </div>
                
                <div>
                  <label htmlFor={`email-${index}`} className="form-label">
                    البريد الإلكتروني
                  </label>
                  <input
                    id={`email-${index}`}
                    type="email"
                    className="form-input"
                    placeholder="example@domain.com"
                    value={credential.email}
                    onChange={(e) => {
                      const updatedCredentials = [...formData.emailCredentials];
                      updatedCredentials[index].email = e.target.value;
                      setFormData({ ...formData, emailCredentials: updatedCredentials });
                    }}
                  />
                </div>
                
                <div>
                  <label htmlFor={`password-${index}`} className="form-label">
                    كلمة المرور
                  </label>
                  <input
                    id={`password-${index}`}
                    type="password"
                    className="form-input"
                    value={credential.password}
                    onChange={(e) => {
                      const updatedCredentials = [...formData.emailCredentials];
                      updatedCredentials[index].password = e.target.value;
                      setFormData({ ...formData, emailCredentials: updatedCredentials });
                    }}
                  />
                </div>
              </div>
            ))}
            
            <button
              type="button"
              className="btn btn-outline text-sm w-full"
              onClick={() => {
                setFormData({
                  ...formData,
                  emailCredentials: [
                    ...formData.emailCredentials,
                    { id: Date.now().toString(), provider: '', email: '', password: '' }
                  ]
                });
              }}
            >
              إضافة بريد إلكتروني آخر
            </button>
          </div>
          
          {/* Service Selection */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">الخدمات المشمولة في الاشتراك</h4>
            
            {/* This is simplified - in a full implementation, you'd have detailed service selection UI */}
            <div className="space-y-4">
              {/* Website Services */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-800">خدمات المواقع الإلكترونية</h5>
                <div className="grid grid-cols-2 gap-2">
                  {settings.prices
                    .filter(price => price.category === 'website')
                    .map(price => (
                      <label key={price.id} className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50">
                        <input
                          type="checkbox"
                          className="ml-2"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                websiteServices: [
                                  ...(formData.websiteServices || []),
                                  { type: price.type as any, price: price.basePrice }
                                ]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                websiteServices: formData.websiteServices?.filter(
                                  service => service.type !== price.type
                                )
                              });
                            }
                          }}
                        />
                        <span className="text-sm">{price.name}</span>
                      </label>
                    ))}
                </div>
              </div>
              
              {/* Design Services */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-800">خدمات التصميم</h5>
                <div className="grid grid-cols-2 gap-2">
                  {settings.prices
                    .filter(price => price.category === 'design')
                    .map(price => (
                      <label key={price.id} className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50">
                        <input
                          type="checkbox"
                          className="ml-2"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                designServices: [
                                  ...(formData.designServices || []),
                                  { 
                                    type: price.type as any, 
                                    platforms: ['facebook', 'instagram'],
                                    monthlyInstances: 4,
                                    price: price.basePrice
                                  }
                                ]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                designServices: formData.designServices?.filter(
                                  service => service.type !== price.type
                                )
                              });
                            }
                          }}
                        />
                        <span className="text-sm">{price.name}</span>
                      </label>
                    ))}
                </div>
              </div>
              
              {/* Management Services */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-800">خدمات الإدارة</h5>
                <div className="grid grid-cols-2 gap-2">
                  {settings.prices
                    .filter(price => price.category === 'management')
                    .map(price => (
                      <label key={price.id} className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50">
                        <input
                          type="checkbox"
                          className="ml-2"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                managementServices: [
                                  ...(formData.managementServices || []),
                                  { 
                                    type: price.type as any,
                                    platforms: price.type === 'socialMedia' ? ['facebook', 'instagram'] : undefined,
                                    monthlyUpdates: 10,
                                    price: price.basePrice
                                  }
                                ]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                managementServices: formData.managementServices?.filter(
                                  service => service.type !== price.type
                                )
                              });
                            }
                          }}
                        />
                        <span className="text-sm">{price.name}</span>
                      </label>
                    ))}
                </div>
              </div>
              
              {/* Advertising Services */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-800">خدمات الإعلانات</h5>
                <div className="grid grid-cols-2 gap-2">
                  {settings.prices
                    .filter(price => price.category === 'advertising')
                    .map(price => (
                      <label key={price.id} className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50">
                        <input
                          type="checkbox"
                          className="ml-2"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                advertisingServices: [
                                  ...(formData.advertisingServices || []),
                                  { 
                                    type: price.type as any,
                                    platforms: ['facebook'],
                                    serviceFee: price.basePrice,
                                    budget: 100,
                                    price: price.basePrice
                                  }
                                ]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                advertisingServices: formData.advertisingServices?.filter(
                                  service => service.type !== price.type
                                )
                              });
                            }
                          }}
                        />
                        <span className="text-sm">{price.name}</span>
                      </label>
                    ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Subscription Summary */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">ملخص الاشتراك</h4>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">مدة الاشتراك:</span>
                <span className="font-medium">{formData.duration} شهر</span>
              </div>
              
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">تاريخ البدء:</span>
                <span className="font-medium">{new Date(formData.startDate).toLocaleDateString('ar-KW')}</span>
              </div>
              
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">تاريخ الانتهاء:</span>
                <span className="font-medium">
                  {new Date(calculateEndDate(formData.startDate, formData.duration)).toLocaleDateString('ar-KW')}
                </span>
              </div>
              
              <div className="pt-2 border-t border-gray-200 mt-2">
                <div className="flex justify-between font-medium">
                  <span className="text-gray-900">إجمالي السعر:</span>
                  <span className="text-primary-600">{formatCurrency(calculateTotalPrice())}</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>
      
      {/* View Subscription Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="تفاصيل الاشتراك"
        footer={
          <div className="flex justify-between w-full">
            {user?.role === 'admin' && selectedSubscription && (
              <button
                onClick={() => {
                  handleDeleteSubscription(selectedSubscription.id);
                  setIsViewModalOpen(false);
                }}
                className="btn btn-outline text-error-600 border-error-300 hover:bg-error-50"
              >
                <Trash2 className="w-4 h-4 ml-1" />
                حذف الاشتراك
              </button>
            )}
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="btn btn-primary"
            >
              إغلاق
            </button>
          </div>
        }
      >
        {selectedSubscription && (
          <div className="space-y-6">
            {/* Subscription Header */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg text-gray-900">{selectedSubscription.clientName}</h3>
                <span className={`badge ${getTierBadgeColor(selectedSubscription.tier)}`}>
                  {formatTier(selectedSubscription.tier)}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">رقم الهاتف:</span>
                  <span className="font-medium">{selectedSubscription.clientPhone}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">مدة الاشتراك:</span>
                  <span className="font-medium">{selectedSubscription.duration} شهر</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">تاريخ البدء:</span>
                  <span className="font-medium">
                    {new Date(selectedSubscription.startDate).toLocaleDateString('ar-KW')}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">تاريخ الانتهاء:</span>
                  <span className={`font-medium ${isExpiringSoon(selectedSubscription.endDate) ? 'text-warning-600' : ''}`}>
                    {new Date(selectedSubscription.endDate).toLocaleDateString('ar-KW')}
                  </span>
                </div>
                
                <div className="flex justify-between text-lg pt-2 border-t border-gray-200 mt-2">
                  <span className="font-medium text-gray-900">إجمالي السعر:</span>
                  <span className="font-bold text-primary-600">
                    {formatCurrency(selectedSubscription.totalPrice)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Email Credentials */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">بيانات اعتماد البريد الإلكتروني</h4>
              
              {selectedSubscription.emailCredentials.length > 0 ? (
                <div className="space-y-3">
                  {selectedSubscription.emailCredentials.map(credential => (
                    <div key={credential.id} className="border border-gray-200 rounded-md p-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">المزود:</span>
                        <span className="font-medium">{credential.provider || 'غير محدد'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">البريد:</span>
                        <span className="font-medium">{credential.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">كلمة المرور:</span>
                        <span className="font-medium">******</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">لا توجد بيانات اعتماد مسجلة</p>
              )}
            </div>
            
            {/* Services */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">الخدمات المشمولة</h4>
              
              <div className="space-y-4">
                {/* Website Services */}
                {selectedSubscription.websiteServices && selectedSubscription.websiteServices.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-800 mb-2">خدمات المواقع الإلكترونية</h5>
                    <div className="space-y-2">
                      {selectedSubscription.websiteServices.map((service, index) => (
                        <div key={index} className="border border-gray-200 rounded-md p-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">نوع الخدمة:</span>
                            <span className="font-medium">
                              {service.type === 'bloggerSetup' ? 'إنشاء موقع بلوجر' :
                               service.type === 'wordpressSetup' ? 'إنشاء موقع ووردبريس' :
                               service.type === 'customWebsite' ? 'موقع ويب مخصص' :
                               service.type === 'landingPage' ? 'صفحة هبوط' : service.type}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">السعر:</span>
                            <span className="font-medium">{formatCurrency(service.price)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Design Services */}
                {selectedSubscription.designServices && selectedSubscription.designServices.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-800 mb-2">خدمات التصميم</h5>
                    <div className="space-y-2">
                      {selectedSubscription.designServices.map((service, index) => (
                        <div key={index} className="border border-gray-200 rounded-md p-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">نوع الخدمة:</span>
                            <span className="font-medium">
                              {service.type === 'poster' ? 'تصميم بوستر إعلاني' :
                               service.type === 'socialMediaReel' ? 'فيديو سوشيال ميديا' :
                               service.type === 'aiVideo' ? 'فيديو ذكاء اصطناعي' :
                               service.type === 'videoTemplate' ? 'قالب فيديو' :
                               service.type === 'storyGraphic' ? 'تصميم ستوري' : service.type}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">المنصات:</span>
                            <span className="font-medium">
                              {service.platforms.join(', ')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">العدد الشهري:</span>
                            <span className="font-medium">{service.monthlyInstances}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">السعر لكل وحدة:</span>
                            <span className="font-medium">{formatCurrency(service.price)}</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-gray-200 mt-1">
                            <span className="text-gray-800">الإجمالي:</span>
                            <span className="font-medium">
                              {formatCurrency(service.price * service.monthlyInstances * selectedSubscription.duration)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Management Services */}
                {selectedSubscription.managementServices && selectedSubscription.managementServices.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-800 mb-2">خدمات الإدارة</h5>
                    <div className="space-y-2">
                      {selectedSubscription.managementServices.map((service, index) => (
                        <div key={index} className="border border-gray-200 rounded-md p-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">نوع الخدمة:</span>
                            <span className="font-medium">
                              {service.type === 'websiteContent' ? 'إدارة محتوى الموقع' :
                               service.type === 'socialMedia' ? 'إدارة وسائل التواصل الاجتماعي' : service.type}
                            </span>
                          </div>
                          {service.platforms && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">المنصات:</span>
                              <span className="font-medium">
                                {service.platforms.join(', ')}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">التحديثات الشهرية:</span>
                            <span className="font-medium">{service.monthlyUpdates}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">السعر لكل تحديث:</span>
                            <span className="font-medium">{formatCurrency(service.price)}</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-gray-200 mt-1">
                            <span className="text-gray-800">الإجمالي:</span>
                            <span className="font-medium">
                              {formatCurrency(service.price * service.monthlyUpdates * selectedSubscription.duration)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Advertising Services */}
                {selectedSubscription.advertisingServices && selectedSubscription.advertisingServices.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-800 mb-2">خدمات الإعلانات</h5>
                    <div className="space-y-2">
                      {selectedSubscription.advertisingServices.map((service, index) => (
                        <div key={index} className="border border-gray-200 rounded-md p-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">نوع الخدمة:</span>
                            <span className="font-medium">
                              {service.type === 'creation' ? 'إنشاء حملة إعلانية' :
                               service.type === 'management' ? 'إدارة حملة إعلانية' :
                               service.type === 'tracking' ? 'تتبع وتقارير الحملات' : service.type}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">المنصات:</span>
                            <span className="font-medium">
                              {service.platforms.join(', ')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">رسوم الخدمة:</span>
                            <span className="font-medium">{formatCurrency(service.serviceFee)}</span>
                          </div>
                          {service.budget && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">ميزانية الإعلان:</span>
                              <span className="font-medium">{formatCurrency(service.budget)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-1 border-t border-gray-200 mt-1">
                            <span className="text-gray-800">الإجمالي:</span>
                            <span className="font-medium">{formatCurrency(service.price)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* No services */}
                {(!selectedSubscription.websiteServices || selectedSubscription.websiteServices.length === 0) &&
                 (!selectedSubscription.designServices || selectedSubscription.designServices.length === 0) &&
                 (!selectedSubscription.managementServices || selectedSubscription.managementServices.length === 0) &&
                 (!selectedSubscription.advertisingServices || selectedSubscription.advertisingServices.length === 0) && (
                  <p className="text-gray-500 text-sm">لا توجد خدمات مسجلة</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Export Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="تصدير الاشتراكات"
        footer={
          <button 
            type="button"
            className="btn btn-outline"
            onClick={() => setIsExportModalOpen(false)}
          >
            إلغاء
          </button>
        }
      >
        <p className="text-gray-600 mb-4">
          اختر صيغة التصدير المناسبة:
        </p>
        
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleExport('pdf')}
            className="btn btn-outline flex flex-col items-center p-4 h-auto"
          >
            <FileText className="h-8 w-8 mb-2 text-primary-600" />
            <span className="text-sm font-medium">PDF</span>
          </button>
          
          <button
            onClick={() => handleExport('excel')}
            className="btn btn-outline flex flex-col items-center p-4 h-auto"
          >
            <FileText className="h-8 w-8 mb-2 text-success-600" />
            <span className="text-sm font-medium">Excel</span>
          </button>
          
          <button
            onClick={() => handleExport('json')}
            className="btn btn-outline flex flex-col items-center p-4 h-auto"
          >
            <FileText className="h-8 w-8 mb-2 text-accent-600" />
            <span className="text-sm font-medium">JSON</span>
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default SubscriptionsPage;