import { Resource } from '../models/resource.js';

export const resourceController = {
    // Create a new resource
    async createResource(req, res) {
        try {
            const programId = req.params.programId;
            const { title, description, type, url, is_external } = req.body;

            // Check if this is an external resource
            const isExternal = is_external === 'true' || is_external === true;

            // Validate required fields
            if (!title) {
                return res.status(400).json({
                    error: "Champ manquant : title"
                });
            }

            if (isExternal) {
                // For external resources, only require title and URL
                if (!url) {
                    return res.status(400).json({
                        error: "URL requise pour les ressources externes"
                    });
                }

                console.log(`Creating external resource with programId: ${programId}`);

                // Create new external resource with minimal fields
                const newResource = new Resource(
                    null,
                    title,
                    null, // no description for external resources
                    'Autre', // default type for external resources
                    true, // is_external = true
                    null, // no file_path
                    url,
                    new Date(),
                    programId,
                    null // no category needed
                );

                const resourceId = await Resource.create(newResource);

                res.status(201).json({
                    id: resourceId,
                    message: "Ressource externe créée avec succès"
                });
            } else {
                // For file resources, require title, type, etc.
                if (!type) {
                    return res.status(400).json({
                        error: "Type de ressource requis"
                    });
                }

                // Validate resource type
                const validTypes = ['Document', 'Tableur', 'Vidéo', 'Présentation', 'Autre'];
                if (!validTypes.includes(type)) {
                    return res.status(400).json({
                        error: "Type de ressource invalide. Les types valides sont: Document, Tableur, Vidéo, Présentation, Autre"
                    });
                }

                // Check if a file was uploaded
                if (!req.file) {
                    return res.status(400).json({
                        error: "Fichier requis pour les ressources non externes"
                    });
                }

                console.log(`Creating file resource with programId: ${programId}`);

                // Get file information
                const filePath = req.file.path;
                const originalFilename = req.file.originalname;

                // Create new file resource
                const newResource = new Resource(
                    null,
                    title,
                    description,
                    type,
                    false, // is_external = false
                    filePath, // store the file path
                    null, // no URL for file resources
                    new Date(),
                    programId,
                    null // no category needed
                );

                const resourceId = await Resource.create(newResource);

                res.status(201).json({
                    id: resourceId,
                    message: "Ressource créée avec succès",
                    filename: originalFilename
                });
            }
        } catch (err) {
            console.error("Erreur lors de la création de la ressource:", err);
            console.error("Error details:", err.stack);

            // If there was an error and a file was uploaded, delete it
            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                    console.log(`Deleted file ${req.file.path} due to error`);
                } catch (unlinkErr) {
                    console.error("Error deleting file:", unlinkErr);
                }
            }

            res.status(500).json({ error: "Erreur serveur", details: err.message });
        }
    },

    // Get all resources for a program
    async getProgramResources(req, res) {
        try {
            const programId = req.params.programId;

            // Get all resources for the program
            const resources = await Resource.getByProgramId(programId);

            // Separate into regular and external resources for backward compatibility
            const regularResources = resources.filter(r => !r.is_external);
            const externalResources = resources.filter(r => r.is_external);

            res.json({
                resources: regularResources,
                externalResources: externalResources
            });
        } catch (err) {
            console.error("Erreur lors de la récupération des ressources:", err);
            res.status(500).json({ error: "Erreur serveur" });
        }
    },

    // Get a specific resource
    async getResource(req, res) {
        try {
            const resourceId = req.params.resourceId;

            const resource = await Resource.getById(resourceId);

            if (!resource) {
                return res.status(404).json({ error: "Ressource non trouvée" });
            }

            res.json(resource);
        } catch (err) {
            console.error("Erreur lors de la récupération de la ressource:", err);
            res.status(500).json({ error: "Erreur serveur" });
        }
    },

    // Download a resource file
    async downloadResource(req, res) {
        try {
            const resourceId = req.params.resourceId;

            const resource = await Resource.getById(resourceId);

            if (!resource) {
                return res.status(404).json({ error: "Ressource non trouvée" });
            }

            // Check if this is a file resource
            if (resource.is_external || !resource.file_path) {
                return res.status(400).json({
                    error: "Cette ressource n'a pas de fichier à télécharger"
                });
            }

            // Check if file exists
            if (!fs.existsSync(resource.file_path)) {
                return res.status(404).json({
                    error: "Le fichier n'existe pas sur le serveur"
                });
            }

            // Get filename from path
            const filename = path.basename(resource.file_path);

            // Set headers for file download
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'application/octet-stream');

            // Stream the file to the response
            const fileStream = fs.createReadStream(resource.file_path);
            fileStream.pipe(res);
        } catch (err) {
            console.error("Erreur lors du téléchargement de la ressource:", err);
            res.status(500).json({ error: "Erreur serveur" });
        }
    },

    // Update a resource
    async updateResource(req, res) {
        try {
            const resourceId = req.params.resourceId;
            const { title, description, type, url, is_external } = req.body;

            // Get existing resource
            const existingResource = await Resource.getById(resourceId);

            if (!existingResource) {
                return res.status(404).json({ error: "Ressource non trouvée" });
            }

            // Check if this is an external resource
            const isExternal = is_external === 'true' || is_external === true || existingResource.is_external;

            let filePath = existingResource.file_path;

            // If this is a file resource and a new file was uploaded
            if (!isExternal && req.file) {
                // Delete the old file if it exists
                if (existingResource.file_path && fs.existsSync(existingResource.file_path)) {
                    try {
                        fs.unlinkSync(existingResource.file_path);
                        console.log(`Deleted old file ${existingResource.file_path}`);
                    } catch (unlinkErr) {
                        console.error("Error deleting old file:", unlinkErr);
                    }
                }

                // Use the new file path
                filePath = req.file.path;
            }

            // Update resource
            const updatedResource = new Resource(
                resourceId,
                title || existingResource.title,
                description || existingResource.description,
                type || existingResource.type,
                isExternal,
                isExternal ? null : filePath, // file_path only for non-external resources
                isExternal ? (url || existingResource.url) : null, // url only for external resources
                existingResource.created_at,
                existingResource.program_id,
                existingResource.category // keep existing category if any
            );

            await Resource.update(resourceId, updatedResource);

            res.json({
                message: "Ressource mise à jour avec succès"
            });
        } catch (err) {
            console.error("Erreur lors de la mise à jour de la ressource:", err);

            // If there was an error and a file was uploaded, delete it
            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                    console.log(`Deleted file ${req.file.path} due to error`);
                } catch (unlinkErr) {
                    console.error("Error deleting file:", unlinkErr);
                }
            }

            res.status(500).json({ error: "Erreur serveur" });
        }
    },

    // Delete a resource
    async deleteResource(req, res) {
        try {
            const resourceId = req.params.resourceId;

            // Get existing resource
            const existingResource = await Resource.getById(resourceId);

            if (!existingResource) {
                return res.status(404).json({ error: "Ressource non trouvée" });
            }

            // If this is a file resource, delete the file
            if (!existingResource.is_external && existingResource.file_path) {
                if (fs.existsSync(existingResource.file_path)) {
                    try {
                        fs.unlinkSync(existingResource.file_path);
                        console.log(`Deleted file ${existingResource.file_path}`);
                    } catch (unlinkErr) {
                        console.error("Error deleting file:", unlinkErr);
                    }
                }
            }

            // Delete resource from database
            await Resource.delete(resourceId);

            res.json({
                message: "Ressource supprimée avec succès"
            });
        } catch (err) {
            console.error("Erreur lors de la suppression de la ressource:", err);
            res.status(500).json({ error: "Erreur serveur" });
        }
    }
};
