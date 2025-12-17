import React, { Component } from 'react';
import axios from 'axios';
import ClientForm from '../components/ClientForm';
import ClientList from '../components/ClientList';
import BookingSystem from '../components/BookingSystem';
import './Clients.css';

class Clients extends Component {
  constructor(props) {
    super(props);
    this.state = {
      clients: [],
      loading: true,
      error: null,
      showForm: false,
      editingClient: null,
      search: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
  }

  componentDidMount() {
    this.fetchClients();
    
    // Auto-save draft every 2 minutes using setTimeout
    this.autoSaveInterval = setInterval(() => {
      this.autoSaveDraft();
    }, 120000); // 2 minutes
  }

  componentWillUnmount() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }

  autoSaveDraft = () => {
    const draft = localStorage.getItem('clientDraft');
    if (draft) {
      console.log('Auto-saving draft...');
      // In a real app, you might send this to a backend endpoint
    }
  };

  fetchClients = async () => {
    try {
      this.setState({ loading: true });
      const params = {
        search: this.state.search,
        sortBy: this.state.sortBy,
        sortOrder: this.state.sortOrder
      };
      const response = await axios.get('/api/clients', { params });
      this.setState({ clients: response.data, loading: false });
    } catch (error) {
      this.setState({ error: error.message, loading: false });
    }
  };

  handleCreate = () => {
    this.setState({ showForm: true, editingClient: null });
  };

  handleEdit = (client) => {
    this.setState({ showForm: true, editingClient: client });
  };

  handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого клиента?')) {
      return;
    }

    try {
      await axios.delete(`/api/clients/${id}`);
      this.fetchClients();
    } catch (error) {
      alert('Ошибка при удалении: ' + error.message);
    }
  };

  handleFormClose = () => {
    this.setState({ showForm: false, editingClient: null });
  };

  handleFormSuccess = () => {
    this.setState({ showForm: false, editingClient: null });
    this.fetchClients();
  };

  handleSearchChange = (e) => {
    this.setState({ search: e.target.value }, () => {
      // Debounce search
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.fetchClients();
      }, 500);
    });
  };

  handleSortChange = (e) => {
    this.setState({ sortBy: e.target.value }, () => {
      this.fetchClients();
    });
  };

  handleSortOrderChange = (e) => {
    this.setState({ sortOrder: e.target.value }, () => {
      this.fetchClients();
    });
  };

  render() {
    const { clients, loading, error, showForm, editingClient, search, sortBy, sortOrder } = this.state;

    if (loading) {
      return <div className="loading">Загрузка клиентов...</div>;
    }

    if (error) {
      return <div className="error">Ошибка: {error}</div>;
    }

    return (
      <div className="clients-page">
        <div className="clients-header">
          <h1>Управление клиентами</h1>
          <button onClick={this.handleCreate} className="create-button">
            + Добавить клиента
          </button>
        </div>

        <div className="clients-filters">
          <input
            type="text"
            placeholder="Поиск по имени, телефону, email..."
            value={search}
            onChange={this.handleSearchChange}
            className="search-input"
          />
          <select value={sortBy} onChange={this.handleSortChange} className="sort-select">
            <option value="createdAt">По дате создания</option>
            <option value="lastName">По фамилии</option>
            <option value="firstName">По имени</option>
          </select>
          <select value={sortOrder} onChange={this.handleSortOrderChange} className="sort-select">
            <option value="desc">По убыванию</option>
            <option value="asc">По возрастанию</option>
          </select>
        </div>

        <ClientList
          clients={clients}
          onEdit={this.handleEdit}
          onDelete={this.handleDelete}
        />

        {showForm && (
          <ClientForm
            client={editingClient}
            onClose={this.handleFormClose}
            onSuccess={this.handleFormSuccess}
          />
        )}

        <BookingSystem />
      </div>
    );
  }
}

export default Clients;

