const Contact = require('../models/Contact');
const User = require('../models/User');

/**
 * Normalize phone number to +91 format without spaces
 */
const normalizePhone = (countryCode, phoneNumber) => {
  const code = (countryCode || '').trim();
  const phone = (phoneNumber || '').trim();
  
  // Remove all spaces and special characters
  const cleanPhone = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  
  // Ensure + prefix for country code
  const cleanCode = code.startsWith('+') ? code : `+${code}`;
  
  // If phone already has country code, return as-is
  if (cleanPhone.startsWith('+')) {
    return cleanPhone;
  }
  
  // Otherwise, combine with country code
  return `${cleanCode}${cleanPhone}`;
};

/**
 * @desc    Add a contact by phone number
 * @route   POST /api/contacts/add
 * @access  Private
 */
const addContact = async (req, res) => {
  const { phoneNumber, countryCode, fullName } = req.body;

  try {
    // Add null check for req.user
    if (!req.user || !req.user._id) {
      console.error('[Contacts] req.user is undefined in addContact:', req.user);
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const normalizedPhone = normalizePhone(countryCode || req.user.countryCode, phoneNumber);
    
    // Check if contact already exists
    const existingContact = await Contact.findOne({ 
      ownerId: req.user._id, 
      phone: normalizedPhone 
    });
    
    if (existingContact) {
      // Update existing contact with saved status and name
      existingContact.saved = true;
      if (fullName) {
        existingContact.fullName = fullName;
      }
      await existingContact.save();
      
      return res.status(200).json({
        contact: {
          id: existingContact._id,
          phone: existingContact.phone,
          fullName: existingContact.fullName,
          saved: existingContact.saved,
          contactUserId: existingContact.contactUserId,
        },
      });
    }

    // Try to find user by phone number
    const contactUser = await User.findOne({ phone: normalizedPhone });
    
    const contact = await Contact.create({
      ownerId: req.user._id,
      contactUserId: contactUser?._id || null,
      phone: normalizedPhone,
      fullName: fullName || normalizedPhone,
      saved: true,
    });

    res.status(201).json({
      contact: {
        id: contact._id,
        phone: contact.phone,
        fullName: contact.fullName,
        saved: contact.saved,
        contactUserId: contact.contactUserId,
      },
    });
  } catch (error) {
    console.error('[Contacts] Error in addContact:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get logged-in user's contacts
 * @route   GET /api/contacts/list
 * @access  Private
 */
const listContacts = async (req, res) => {
  try {
    // Add null check for req.user
    if (!req.user || !req.user._id) {
      console.error('[Contacts] req.user is undefined:', req.user);
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const contacts = await Contact.find({ ownerId: req.user._id })
      .populate('contactUserId', 'fullName email countryCode phoneNumber')
      .sort({ createdAt: -1 });

    const formatted = contacts.map((c) => {
      // Add null check for c.contactUserId to prevent undefined errors
      if (!c.contactUserId) {
        console.error('[Contacts] Contact has missing contactUserId:', c);
        return {
          id: c._id,
          phone: c.phone,
          fullName: c.fullName,
          saved: c.saved,
          contactUserId: null,
        };
      }

      return {
        id: c._id,
        phone: c.phone,
        fullName: c.fullName || c.contactUserId.fullName,
        saved: c.saved,
        contactUserId: c.contactUserId._id,
      };
    });

    res.json({ contacts: formatted });
  } catch (error) {
    console.error('[Contacts] Error in listContacts:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Save an unsaved contact
 * @route   POST /api/contacts/save
 * @access  Private
 */
const saveContact = async (req, res) => {
  const { phone, fullName } = req.body;

  try {
    // Add null check for req.user
    if (!req.user || !req.user._id) {
      console.error('[Contacts] req.user is undefined in saveContact:', req.user);
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!phone || !fullName) {
      return res.status(400).json({ message: 'Phone number and full name are required' });
    }

    const normalizedPhone = normalizePhone('', phone);
    
    // Find or create contact
    let contact = await Contact.findOne({ 
      ownerId: req.user._id, 
      phone: normalizedPhone 
    });
    
    if (!contact) {
      // Create new contact
      const contactUser = await User.findOne({ phone: normalizedPhone });
      contact = await Contact.create({
        ownerId: req.user._id,
        contactUserId: contactUser?._id || null,
        phone: normalizedPhone,
        fullName: fullName,
        saved: true,
      });
    } else {
      // Update existing contact
      contact.saved = true;
      contact.fullName = fullName;
      await contact.save();
    }

    res.status(200).json({
      contact: {
        id: contact._id,
        phone: contact.phone,
        fullName: contact.fullName,
        saved: contact.saved,
        contactUserId: contact.contactUserId,
      },
    });
  } catch (error) {
    console.error('[Contacts] Error in saveContact:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addContact, listContacts, saveContact };
