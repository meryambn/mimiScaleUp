import { Admin } from '../models/admin.js';
import { AdminProfile } from '../models/adminProfile.js';

export const adminProfileController = {
    // Get admin profile
    async getAdminProfile(req, res) {
        try {
            // Get admin ID from request parameters
            const adminId = req.params.adminId;
            console.log("Admin ID received:", adminId);

            // Check if the admin exists
            const admin = await Admin.findById(adminId);
            if (!admin) {
                return res.status(404).json({ error: 'Admin not found' });
            }

            // Get admin profile (or create if it doesn't exist)
            const profile = await AdminProfile.getOrCreate(adminId, {
                nom: '',
                prenom: '',
                telephone: '',
                photo: '/default-avatar.jpg',
                biographie: '',
                accelerator_name: '',
                location: '',
                year_founded: null,
                website: '',
                contact_info: ''
            });

            // Build the response data
            const data = {
                id: admin.id,
                email: admin.email,
                nom: profile.nom || '',
                prenom: profile.prenom || '',
                telephone: profile.telephone || '',
                photo: profile.photo || '/default-avatar.jpg',
                biographie: profile.biographie || '',
                accelerator_name: profile.accelerator_name || '',
                location: profile.location || '',
                year_founded: profile.year_founded || null,
                website: profile.website || '',
                contact_info: profile.contact_info || ''
            };

            // Return the admin profile data
            res.status(200).json(data);
        } catch (error) {
            console.error("Error retrieving admin profile:", error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Update admin profile
    async updateAdminProfile(req, res) {
        try {
            // Get admin ID from request parameters
            const adminId = req.params.adminId;
            console.log("Admin ID for update:", adminId);

            // Get profile data from request body
            const { nom, prenom, telephone, biographie, accelerator_name, location, year_founded, website, contact_info } = req.body;

            // Check if the admin exists
            const admin = await Admin.findById(adminId);
            if (!admin) {
                return res.status(404).json({ error: 'Admin not found' });
            }

            // Update profile data
            const updatedProfile = await AdminProfile.update(adminId, {
                nom,
                prenom,
                telephone,
                biographie,
                accelerator_name,
                location,
                year_founded,
                website,
                contact_info
            });

            if (!updatedProfile) {
                return res.status(404).json({ error: 'Admin profile not found' });
            }

            // Return success response
            res.status(200).json({
                message: 'Profile updated successfully',
                profile: updatedProfile
            });
        } catch (error) {
            console.error("Error updating admin profile:", error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Update admin profile photo
    async updateAdminPhoto(req, res) {
        try {
            // Get admin ID from request parameters
            const adminId = req.params.adminId;
            console.log("Admin ID for photo update:", adminId);

            // Get photo path from request body
            const { photo } = req.body;

            if (!photo) {
                return res.status(400).json({ error: 'Photo path is required' });
            }

            // Check if the admin exists
            const admin = await Admin.findById(adminId);
            if (!admin) {
                return res.status(404).json({ error: 'Admin not found' });
            }

            // Update profile photo
            const updatedProfile = await AdminProfile.update(adminId, { photo });

            if (!updatedProfile) {
                return res.status(404).json({ error: 'Admin profile not found' });
            }

            // Return success response
            res.status(200).json({
                message: 'Profile photo updated successfully',
                photo: updatedProfile.photo
            });
        } catch (error) {
            console.error("Error updating admin profile photo:", error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};
