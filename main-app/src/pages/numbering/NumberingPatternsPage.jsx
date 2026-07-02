import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Typography,
  Box,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  Refresh,
  Code,
  Calculate,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const NumberingPatternsPage = () => {
  const navigate = useNavigate();
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generatedNumber, setGeneratedNumber] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateContext, setGenerateContext] = useState({ branch: '', product: '' });
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  
  const { user } = useAuth();
  const institutionId = user?.institutionId || 'INST001';

  useEffect(() => {
    fetchPatterns();
  }, []);

  const fetchPatterns = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/numbering/patterns/?institution_id=${institutionId}`);
      setPatterns(response.data);
      
      // Calculate stats
      const active = response.data.filter(p => p.status === 'ACTIVE').length;
      const inactive = response.data.filter(p => p.status === 'INACTIVE').length;
      setStats({
        total: response.data.length,
        active: active,
        inactive: inactive
      });
    } catch (error) {
      console.error('Failed to fetch patterns:', error);
      toast.error('Failed to load patterns');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPattern) return;
    
    try {
      await api.delete(`/numbering/patterns/${selectedPattern.num_pat_id}/`);
      toast.success('Pattern deleted successfully');
      fetchPatterns();
      setDeleteDialogOpen(false);
      setSelectedPattern(null);
    } catch (error) {
      console.error('Failed to delete pattern:', error);
      toast.error('Failed to delete pattern');
    }
  };

  const handleToggleStatus = async (pattern) => {
    const newStatus = pattern.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/numbering/patterns/${pattern.num_pat_id}/`, {
        ...pattern,
        status: newStatus
      });
      toast.success(`Pattern ${newStatus.toLowerCase()}`);
      fetchPatterns();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await api.post('/numbering/generate/', {
        institution_id: institutionId,
        pattern_id: selectedPattern.num_pat_id,
        context: generateContext
      });
      setGeneratedNumber(response.data.generated_number);
      toast.success('Number generated successfully!');
    } catch (error) {
      console.error('Failed to generate number:', error);
      toast.error(error.response?.data?.error || 'Failed to generate number');
    } finally {
      setGenerating(false);
    }
  };

  const getStatusChip = (status) => {
    const config = {
      ACTIVE: { color: 'success', icon: <CheckCircle fontSize="small" /> },
      INACTIVE: { color: 'default', icon: <Cancel fontSize="small" /> },
      DELETED: { color: 'error', icon: <Cancel fontSize="small" /> }
    };
    const { color, icon } = config[status] || config.INACTIVE;
    return <Chip label={status} color={color} size="small" icon={icon} />;
  };

  const filteredPatterns = patterns.filter(pattern => {
    const matchesSearch = 
      pattern.num_pat_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pattern.pattern_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || pattern.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const StatCard = ({ title, value, color, icon }) => (
    <Paper
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: `4px solid ${color}`,
      }}
    >
      <Box>
        <Typography variant="h4" component="div" fontWeight="bold">
          {value}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {title}
        </Typography>
      </Box>
      <Box sx={{ color: color, fontSize: 32 }}>{icon}</Box>
    </Paper>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Numbering Patterns
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/numbering/new')}
        >
          Create Pattern
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Box display="flex" gap={2} mb={3}>
        <Box flex={1}>
          <StatCard 
            title="Total Patterns" 
            value={stats.total} 
            color="#1976d2" 
            icon={<Code />} 
          />
        </Box>
        <Box flex={1}>
          <StatCard 
            title="Active" 
            value={stats.active} 
            color="#2e7d32" 
            icon={<CheckCircle />} 
          />
        </Box>
        <Box flex={1}>
          <StatCard 
            title="Inactive" 
            value={stats.inactive} 
            color="#ed6c02" 
            icon={<Cancel />} 
          />
        </Box>
        <Box flex={1}>
          <StatCard 
            title="Available to Generate" 
            value={stats.active} 
            color="#9c27b0" 
            icon={<Calculate />} 
          />
        </Box>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField
            size="small"
            placeholder="Search by Pattern ID or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250, flex: 1 }}
          />
          
          <Box display="flex" gap={1} alignItems="center">
            <Typography variant="body2" color="textSecondary">
              Status:
            </Typography>
            <Button
              size="small"
              variant={statusFilter === 'all' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('all')}
            >
              All
            </Button>
            <Button
              size="small"
              variant={statusFilter === 'ACTIVE' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('ACTIVE')}
              color="success"
            >
              Active
            </Button>
            <Button
              size="small"
              variant={statusFilter === 'INACTIVE' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('INACTIVE')}
              color="warning"
            >
              Inactive
            </Button>
          </Box>
          
          <Button variant="outlined" onClick={fetchPatterns} startIcon={<Refresh />}>
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Patterns Table */}
      {filteredPatterns.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No patterns found. Click "Create Pattern" to add your first numbering pattern.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: '#1976d2' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Pattern ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Pattern Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Sequence Range</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Step</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPatterns.map((pattern) => (
                <TableRow key={pattern.num_pat_id} hover>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace" fontWeight="medium">
                      {pattern.num_pat_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold">
                      {pattern.pattern_name}
                    </Typography>
                    {pattern.remarks && (
                      <Typography variant="caption" color="textSecondary">
                        {pattern.remarks}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {pattern.seq_start.toLocaleString()} → {pattern.seq_end.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={`+${pattern.seq_step}`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{getStatusChip(pattern.status)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/numbering/${pattern.num_pat_id}`)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Pattern">
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => navigate(`/numbering/${pattern.num_pat_id}/edit`)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Generate Number">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => {
                          setSelectedPattern(pattern);
                          setGenerateContext({ branch: '', product: '' });
                          setGeneratedNumber(null);
                          setGenerateDialogOpen(true);
                        }}
                      >
                        <Calculate />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={pattern.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                      <IconButton
                        size="small"
                        color={pattern.status === 'ACTIVE' ? 'warning' : 'success'}
                        onClick={() => handleToggleStatus(pattern)}
                      >
                        {pattern.status === 'ACTIVE' ? <Cancel /> : <CheckCircle />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Pattern">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setSelectedPattern(pattern);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the pattern <strong>"{selectedPattern?.pattern_name}"</strong>?
          </Typography>
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            Warning: This action cannot be undone. All associated data will be lost.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Number Dialog */}
      <Dialog open={generateDialogOpen} onClose={() => setGenerateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Generate Number - {selectedPattern?.pattern_name}
          <Typography variant="caption" color="textSecondary" display="block">
            Optional context values for dynamic tokens
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Branch Code (Optional)"
            value={generateContext.branch}
            onChange={(e) => setGenerateContext({ ...generateContext, branch: e.target.value })}
            margin="normal"
            placeholder="e.g., BLR, MUM, DEL"
            helperText="Used for {BRANCH} token"
          />
          <TextField
            fullWidth
            label="Product Code (Optional)"
            value={generateContext.product}
            onChange={(e) => setGenerateContext({ ...generateContext, product: e.target.value })}
            margin="normal"
            placeholder="e.g., PROD, SERV, CONS"
            helperText="Used for {PRODUCT} token"
          />
          
          {generatedNumber && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <strong>Generated Number:</strong>
              <Typography variant="h6" fontFamily="monospace" sx={{ mt: 1 }}>
                {generatedNumber}
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)}>Close</Button>
          <Button 
            onClick={handleGenerate} 
            variant="contained" 
            color="primary"
            disabled={generating}
          >
            {generating ? <CircularProgress size={24} /> : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default NumberingPatternsPage;