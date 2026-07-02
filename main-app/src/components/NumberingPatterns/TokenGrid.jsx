import React, { useState, useEffect } from 'react';
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Box, Typography, Alert, CircularProgress
} from '@mui/material';
import { Edit, Delete, Add, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../api/client';

const TOKEN_OPTIONS = [
  { value: 'PREFIX', label: 'Prefix', hasValue: true, hasLength: false, hasPolicy: false },
  { value: 'SUFFIX', label: 'Suffix', hasValue: true, hasLength: false, hasPolicy: false },
  { value: 'SEQ', label: 'Sequence', hasValue: false, hasLength: true, hasPolicy: true },
  { value: 'YYYY', label: 'Year (4-digit)', hasValue: false, hasLength: false, hasPolicy: false },
  { value: 'YY', label: 'Year (2-digit)', hasValue: false, hasLength: false, hasPolicy: false },
  { value: 'MM', label: 'Month', hasValue: false, hasLength: false, hasPolicy: false },
  { value: 'DD', label: 'Day', hasValue: false, hasLength: false, hasPolicy: false },
  { value: 'FY', label: 'Financial Year', hasValue: false, hasLength: false, hasPolicy: false },
  { value: 'STATIC', label: 'Static Text', hasValue: true, hasLength: false, hasPolicy: false },
  { value: 'BRANCH', label: 'Branch', hasValue: false, hasLength: false, hasPolicy: false },
  { value: 'PRODUCT', label: 'Product', hasValue: false, hasLength: false, hasPolicy: false },
];

const RESET_POLICIES = [
  { value: 'FY', label: 'Financial Year' },
  { value: 'YEAR', label: 'Year' },
  { value: 'MONTH', label: 'Month' },
  { value: 'NEVER', label: 'Never' },
];

const TokenGrid = ({ institutionId, numPatId, onRefresh }) => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingToken, setEditingToken] = useState(null);
  const [formData, setFormData] = useState({
    token_order: 1,
    token_id: 'PREFIX',
    token_value: '',
    seq_length: null,
    reset_policy: null
  });

  useEffect(() => {
    if (numPatId) {
      fetchTokens();
    }
  }, [numPatId]);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/numbering/details/?num_pat_id=${numPatId}`);
      setTokens(response.data);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      toast.error('Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (token = null) => {
    if (token) {
      setEditingToken(token);
      setFormData({
        token_order: token.token_order,
        token_id: token.token_id,
        token_value: token.token_value || '',
        seq_length: token.seq_length || null,
        reset_policy: token.reset_policy || null
      });
    } else {
      setEditingToken(null);
      setFormData({
        token_order: tokens.length + 1,
        token_id: 'PREFIX',
        token_value: '',
        seq_length: null,
        reset_policy: null
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingToken(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTokenChange = (e) => {
    const tokenId = e.target.value;
    const tokenConfig = TOKEN_OPTIONS.find(t => t.value === tokenId);
    setFormData(prev => ({
      ...prev,
      token_id: tokenId,
      token_value: tokenConfig?.hasValue ? prev.token_value : '',
      seq_length: tokenConfig?.hasLength ? prev.seq_length : null,
      reset_policy: tokenConfig?.hasPolicy ? prev.reset_policy : null
    }));
  };

  const handleSaveToken = async () => {
    const payload = {
      institution_id: institutionId,
      num_pat_id: numPatId,
      token_order: formData.token_order,
      token_id: formData.token_id,
      token_value: formData.token_value || null,
      seq_length: formData.seq_length ? parseInt(formData.seq_length) : null,
      reset_policy: formData.reset_policy || null,
      num_pat_status: 'ACTIVE'
    };

    try {
      if (editingToken) {
        await api.put(`/numbering/details/${editingToken.id}/`, payload);
        toast.success('Token updated successfully');
      } else {
        await api.post('/numbering/details/', payload);
        toast.success('Token added successfully');
      }
      handleCloseDialog();
      fetchTokens();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Failed to save token:', error);
      toast.error(error.response?.data?.error || 'Failed to save token');
    }
  };

  const handleDeleteToken = async (id) => {
    if (window.confirm('Are you sure you want to delete this token?')) {
      try {
        await api.delete(`/numbering/details/${id}/`);
        toast.success('Token deleted successfully');
        fetchTokens();
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error('Failed to delete token:', error);
        toast.error('Failed to delete token');
      }
    }
  };

  const handleMove = async (index, direction) => {
    const newTokens = [...tokens];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= tokens.length) return;
    
    const temp = newTokens[index].token_order;
    newTokens[index].token_order = newTokens[newIndex].token_order;
    newTokens[newIndex].token_order = temp;
    
    const orders = newTokens.map(t => ({ id: t.id, token_order: t.token_order }));
    
    try {
      await api.post('/numbering/details/reorder/', { num_pat_id: numPatId, orders });
      fetchTokens();
      toast.success('Order updated');
    } catch (error) {
      console.error('Failed to reorder:', error);
      toast.error('Failed to reorder');
    }
  };

  const getTokenLabel = (tokenId) => {
    return TOKEN_OPTIONS.find(t => t.value === tokenId)?.label || tokenId;
  };

  const hasSeq = tokens.some(t => t.token_id === 'SEQ');

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Token Configuration</Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Token
        </Button>
      </Box>

      {!hasSeq && tokens.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Pattern must contain a SEQ token. Please add a Sequence token.
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell><strong>Order</strong></TableCell>
              <TableCell><strong>Token</strong></TableCell>
              <TableCell><strong>Value</strong></TableCell>
              <TableCell><strong>Length</strong></TableCell>
              <TableCell><strong>Reset Policy</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tokens.map((token, idx) => (
              <TableRow key={token.id}>
                <TableCell>{token.token_order}</TableCell>
                <TableCell>{getTokenLabel(token.token_id)}</TableCell>
                <TableCell>{token.token_value || '-'}</TableCell>
                <TableCell>{token.seq_length || '-'}</TableCell>
                <TableCell>{token.reset_policy || '-'}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleMove(idx, 'up')}>
                    <ArrowUpward fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleMove(idx, 'down')}>
                    <ArrowDownward fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="primary" onClick={() => handleOpenDialog(token)}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteToken(token.id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {tokens.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No tokens configured. Click "Add Token" to start.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Token Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingToken ? 'Edit Token' : 'Add Token'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label="Token Type"
            name="token_id"
            value={formData.token_id}
            onChange={handleTokenChange}
            margin="normal"
            disabled={!!editingToken}
          >
            {TOKEN_OPTIONS.map(option => (
              <MenuItem 
                key={option.value} 
                value={option.value}
                disabled={option.value === 'SEQ' && hasSeq && !editingToken}
              >
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Order"
            name="token_order"
            type="number"
            value={formData.token_order}
            onChange={handleFormChange}
            margin="normal"
            inputProps={{ min: 1 }}
          />

          {TOKEN_OPTIONS.find(t => t.value === formData.token_id)?.hasValue && (
            <TextField
              fullWidth
              label="Token Value"
              name="token_value"
              value={formData.token_value}
              onChange={handleFormChange}
              margin="normal"
              placeholder="e.g., INV, /, -"
            />
          )}

          {TOKEN_OPTIONS.find(t => t.value === formData.token_id)?.hasLength && (
            <TextField
              fullWidth
              label="Sequence Length"
              name="seq_length"
              type="number"
              value={formData.seq_length || ''}
              onChange={handleFormChange}
              margin="normal"
              placeholder="e.g., 5 for 00001"
              inputProps={{ min: 1, max: 20 }}
            />
          )}

          {TOKEN_OPTIONS.find(t => t.value === formData.token_id)?.hasPolicy && (
            <TextField
              fullWidth
              select
              label="Reset Policy"
              name="reset_policy"
              value={formData.reset_policy || ''}
              onChange={handleFormChange}
              margin="normal"
            >
              {RESET_POLICIES.map(policy => (
                <MenuItem key={policy.value} value={policy.value}>
                  {policy.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveToken} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TokenGrid;