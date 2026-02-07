/**
 * CHN IT Support System
 * Tickets Module
 * Version: 3.1.0
 */

const Tickets = {
  cache: [],
  myTickets: [],
  engineers: [],
  stats: null,
  
  currentPage: 1,
  totalPages: 1,
  itemsPerPage: CONFIG.ITEMS_PER_PAGE || 20,
  
  filters: {
    status: 'All',
    priority: 'All',
    category: 'All',
    search: ''
  },
  
  // Create Ticket
  async create(ticketData) {
    try {
      // Add user info
      ticketData.createdBy = Auth.getUserName();
      ticketData.createdByEmail = Auth.getUserEmail();
      ticketData.createdByDepartment = Auth.getUserDepartment();
      ticketData.createdByDesignation = Auth.getUserDesignation();
      
      // Validate
      if (!ticketData.category) {
        return { success: false, message: 'Please select a category' };
      }
      
      if (!ticketData.title || ticketData.title.length < 5) {
        return { success: false, message: 'Subject must be at least 5 characters' };
      }
      
      if (!ticketData.description || ticketData.description.length < 10) {
        return { success: false, message: 'Description must be at least 10 characters' };
      }
      
      const result = await Utils.api('createTicket', { ticketData: ticketData });
      
      if (result.success) {
        Sound.play('success');
        this.cache = [];
        this.myTickets = [];
      }
      
      return result;
      
    } catch (error) {
      console.error('Create ticket error:', error);
      return { success: false, message: 'Failed to create ticket' };
    }
  },
  
  // Get All Tickets
  async getAll(filters = {}) {
    try {
      const result = await Utils.api('getTickets', {
        filters: { ...this.filters, ...filters }
      });
      
      if (result.success) {
        this.cache = result.tickets || [];
        this.totalPages = Math.ceil(this.cache.length / this.itemsPerPage);
      }
      
      return result;
      
    } catch (error) {
      console.error('Get tickets error:', error);
      return { success: false, tickets: [] };
    }
  },
  
  // Get My Tickets
  async getMyTickets() {
    try {
      const result = await Utils.api('getTickets', {
        filters: { createdByEmail: Auth.getUserEmail() }
      });
      
      if (result.success) {
        this.myTickets = result.tickets || [];
      }
      
      return result;
      
    } catch (error) {
      console.error('Get my tickets error:', error);
      return { success: false, tickets: [] };
    }
  },
  
  // Get Ticket by ID
  async getById(ticketId) {
    try {
      // Check cache first
      let ticket = this.cache.find(t => t.ticketId === ticketId);
      if (ticket) {
        return { success: true, ticket: ticket };
      }
      
      const result = await Utils.api('getTicket', { ticketId: ticketId });
      return result;
      
    } catch (error) {
      console.error('Get ticket error:', error);
      return { success: false, message: 'Failed to load ticket' };
    }
  },
  
  // Get Recent Tickets
  async getRecent(limit = 5) {
    try {
      if (this.cache.length === 0) {
        await this.getAll();
      }
      return this.cache.slice(0, limit);
    } catch (error) {
      return [];
    }
  },
  
  // Get My Recent Tickets
  async getMyRecent(limit = 5) {
    try {
      if (this.myTickets.length === 0) {
        await this.getMyTickets();
      }
      return this.myTickets.slice(0, limit);
    } catch (error) {
      return [];
    }
  },
  
  // Update Ticket
  async update(ticketId, updates, isAdmin = false) {
    try {
      updates.updatedBy = Auth.getUserName();
      updates.updatedByEmail = Auth.getUserEmail();
      
      const result = await Utils.api('updateTicket', {
        ticketId: ticketId,
        updates: updates,
        isAdmin: isAdmin ? 'true' : 'false'
      });
      
      if (result.success) {
        Sound.play('success');
        this.cache = [];
        this.myTickets = [];
      }
      
      return result;
      
    } catch (error) {
      console.error('Update ticket error:', error);
      return { success: false, message: 'Failed to update ticket' };
    }
  },
  
  // Submit Feedback
  async submitFeedback(ticketId, rating, comment = '') {
    try {
      if (!rating || rating < 1 || rating > 5) {
        return { success: false, message: 'Please select a rating (1-5)' };
      }
      
      const result = await Utils.api('submitFeedback', {
        ticketId: ticketId,
        rating: rating,
        comment: comment
      });
      
      if (result.success) {
        Sound.play('success');
        this.cache = [];
        this.myTickets = [];
      }
      
      return result;
      
    } catch (error) {
      console.error('Feedback error:', error);
      return { success: false, message: 'Failed to submit feedback' };
    }
  },
  
  // Get Stats
  async getStats() {
    try {
      const result = await Utils.api('getStats');
      
      if (result.success) {
        this.stats = result.stats;
      }
      
      return result;
      
    } catch (error) {
      console.error('Get stats error:', error);
      return {
        success: false,
        stats: { open: 0, inProgress: 0, resolved: 0, critical: 0, high: 0, resolvedToday: 0 }
      };
    }
  },
  
  // Get Activity Feed
  async getActivityFeed(limit = 10) {
    try {
      const result = await Utils.api('getActivityFeed', { limit: limit });
      return result.success ? (result.activities || []) : [];
    } catch (error) {
      return [];
    }
  },
  
  // Get Engineers
  async getEngineers() {
    try {
      const result = await Utils.api('getEngineers');
      
      if (result.success) {
        this.engineers = result.engineers || [];
      }
      
      return result;
      
    } catch (error) {
      console.error('Get engineers error:', error);
      return { success: false, engineers: [] };
    }
  },
  
  // Set Filters
  setFilters(filters) {
    this.filters = { ...this.filters, ...filters };
    this.currentPage = 1;
  },
  
  // Clear Filters
  clearFilters() {
    this.filters = {
      status: 'All',
      priority: 'All',
      category: 'All',
      search: ''
    };
    this.currentPage = 1;
  },
  
  // Filter Tickets
  filterTickets(tickets) {
    let filtered = [...tickets];
    
    if (this.filters.status && this.filters.status !== 'All') {
      filtered = filtered.filter(t => t.status === this.filters.status);
    }
    
    if (this.filters.priority && this.filters.priority !== 'All') {
      filtered = filtered.filter(t => t.priority === this.filters.priority);
    }
    
    if (this.filters.category && this.filters.category !== 'All') {
      filtered = filtered.filter(t => t.category === this.filters.category);
    }
    
    if (this.filters.search) {
      const q = this.filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        (t.ticketId && t.ticketId.toLowerCase().includes(q)) ||
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.createdBy && t.createdBy.toLowerCase().includes(q))
      );
    }
    
    return filtered;
  },
  
  // Paginate
  paginate(tickets, page = 1) {
    const start = (page - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return tickets.slice(start, end);
  },
  
  // Navigation
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  },
  
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  },
  
  // Export
  exportToCSV() {
    const data = this.cache;
    
    if (!data || data.length === 0) {
      Utils.showToast('No tickets to export', 'warning');
      return;
    }
    
    Utils.exportToCSV(data, 'tickets_export');
  },
  
  // Helpers
  getPriorityClass(priority) {
    return (priority || 'medium').toLowerCase();
  },
  
  getStatusClass(status) {
    return Utils.statusToClass(status);
  },
  
  canSubmitFeedback(ticket) {
    return (
      ticket.createdByEmail === Auth.getUserEmail() &&
      ticket.status === 'Resolved' &&
      !ticket.feedbackRating
    );
  }
};