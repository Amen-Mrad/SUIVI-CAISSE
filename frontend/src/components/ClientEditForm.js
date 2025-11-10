import React, { useState, useEffect } from 'react';

export default function ClientEditForm({ client, onClientUpdated, onCancel }) {
  const [formData, setFormData] = useState({
    nom_complet: '',
    username: '',
    telephone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fonction pour splitter le nom complet en nom et prénom
  const splitNomComplet = (nomComplet) => {
    const trimmed = nomComplet.trim();
    if (!trimmed) return { nom: '', prenom: '' };
    
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) {
      // Si un seul mot, mettre dans nom et prénom vide
      return { nom: parts[0], prenom: '' };
    } else {
      // Premier mot = nom, le reste = prénom
      return { nom: parts[0], prenom: parts.slice(1).join(' ') };
    }
  };

  useEffect(() => {
    if (client) {
      // Combiner nom et prénom en nom_complet
      const nomComplet = `${client.nom || ''} ${client.prenom || ''}`.trim();
      setFormData({
        nom_complet: nomComplet,
        username: client.username || '',
        telephone: client.telephone || ''
      });
    }
  }, [client]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Splitter le nom complet en nom et prénom
    const { nom, prenom } = splitNomComplet(formData.nom_complet);
    const submitData = {
      nom,
      prenom,
      username: formData.username,
      telephone: formData.telephone
    };

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        // Appeler la fonction de callback
        onClientUpdated();
      } else {
        setError(data.error || 'Erreur lors de la modification du client');
      }
    } catch (err) {
      console.error('Erreur lors de la modification du client:', err);
      setError('Erreur lors de la modification du client');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label">Nom et Prénom *</label>
          <input
            type="text"
            className="form-control"
            name="nom_complet"
            value={formData.nom_complet}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6 mb-3">
          <label className="form-label">Username *</label>
          <input
            type="text"
            className="form-control"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label">Téléphone *</label>
          <input
            type="tel"
            className="form-control"
            name="telephone"
            value={formData.telephone}
            onChange={handleChange}
            required
          />
        </div>
      </div>


      <div className="d-flex gap-2">
        <button 
          type="submit" 
          className="btn btn-success"
          disabled={loading}
        >
          {loading ? 'Modification en cours...' : 'Modifier'}
        </button>
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={onCancel}
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
