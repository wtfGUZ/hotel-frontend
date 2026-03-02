import { useState } from 'react';

export const useModals = () => {
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [alertMessage, setAlertMessage] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [showQuickGuestForm, setShowQuickGuestForm] = useState(false);
    const [quickGuestData, setQuickGuestData] = useState({});
    const [guestSearchTerm, setGuestSearchTerm] = useState('');
    const [showGuestDropdown, setShowGuestDropdown] = useState(false);

    const openModal = (type, item = null, prefillData = null) => {
        setModalType(type);
        setEditingItem(item);
        if (item) {
            setFormData(item);
            // handled externally for guestSearchTerm if needed
        } else if (prefillData) {
            setFormData(prefillData);
            setGuestSearchTerm('');
        } else {
            setFormData({});
            setGuestSearchTerm('');
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData({});
        setEditingItem(null);
        setShowQuickGuestForm(false);
        setQuickGuestData({});
        setGuestSearchTerm('');
        setShowGuestDropdown(false);
    };

    return {
        showModal,
        setShowModal,
        modalType,
        setModalType,
        editingItem,
        setEditingItem,
        formData,
        setFormData,
        alertMessage,
        setAlertMessage,
        deleteConfirm,
        setDeleteConfirm,
        showQuickGuestForm,
        setShowQuickGuestForm,
        quickGuestData,
        setQuickGuestData,
        guestSearchTerm,
        setGuestSearchTerm,
        showGuestDropdown,
        setShowGuestDropdown,
        openModal,
        closeModal
    };
};
