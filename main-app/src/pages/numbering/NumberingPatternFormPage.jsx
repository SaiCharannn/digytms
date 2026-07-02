import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save,
  Cancel,
  Refresh,
  Visibility,
  Add,
  Delete,
  Edit,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', color: 'success' },
  { value: 'INACTIVE', label: 'Inactive', color: 'default' },
];

const TOKEN_OPTIONS = [
  { value: 'PREFIX', label: 'Prefix', icon: '📝', hasValue: true, description: 'Static text at the beginning' },
  { value: 'SUFFIX', label: 'Suffix', icon: '📎', hasValue: true, description: 'Static text at the end' },
  { value: 'SEQ', label: 'Sequence', icon: '🔢', hasValue: false, hasLength: true, hasPolicy: true, description: 'Auto-incrementing number' },
  { value: 'YYYY', label: 'Year (4-digit)', icon: '📅', hasValue: false, description: 'Current year (e.g., 2024)' },
  { value: 'YY', label: 'Year (2-digit)', icon: '📆', hasValue: false, description: 'Last two digits of year (e.g., 24)' },
  { value: 'MM', label: 'Month', icon: '📊', hasValue: false, description: 'Current month (01-12)' },
  { value: 'DD', label: 'Day', icon: '🌞', hasValue: false, description: 'Current day (01-31)' },
  { value: 'FY', label: 'Financial Year', icon: '💰', hasValue: false, description: 'Financial year (e.g., 24-25)' },
  { value: 'STATIC', label: 'Static Text', icon: '📄', hasValue: true, description: 'Custom static text' },
  { value: 'BRANCH', label: 'Branch', icon: '🏢', hasValue: false, description: 'Branch code from context' },
  { value: 'PRODUCT', label: 'Product', icon: '📦', hasValue: false, description: 'Product code from context' },
];

const RESET_POLICIES = [
  { value: 'NEVER', label: 'Never Reset', description: 'Sequence continues forever' },
  { value: 'YEAR', label: 'Yearly', description: 'Resets at the start of each year' },
  { value: 'MONTH', label: 'Monthly', description: 'Resets at the start of each month' },
  { value: 'FY', label: 'Financial Year', description: 'Resets at the start of financial year (April)' },
];

const NumberingPatternFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { user } = useAuth();
  const institutionId = user?.institutionId || 'INST001';

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewNumber, setPreviewNumber] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [editingToken, setEditingToken] = useState(null);
  const [tokenFormData, setTokenFormData] = useState({
    token_order: 1,
    token_id: 'PREFIX',
    token_value: '',
    seq_length: 5,
    reset_policy: 'NEVER',
  });

  const [formData, setFormData] = useState({
    institution_id: institutionId,
    num_pat_id: '',
    pattern_name: '',
    remarks: '',
    seq_start: 1,
    seq_end: 99999,
    seq_step: 1,
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (isEditing && id) {
      fetchPattern();
      fetchTokens();
    }
  }, [id]);

  const fetchPattern = async () => {
    try {
      const response = await api.get(`/numbering/patterns/${id}/`);
      setFormData(response.data);
    } catch (error) {
      console.error('Failed to fetch pattern:', error);
      toast.error('Failed to load pattern');
      navigate('/numbering');
    } finally {
      setFetching(false);
    }
  };

  const fetchTokens = async () => {
    setTokensLoading(true);
    try {
      const response = await api.get(`/numbering/details/?num_pat_id=${id}`);
      setTokens(response.data);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    } finally {
      setTokensLoading(false);
    }
  };

  const generatePreview = async () => {
    if (!formData.num_pat_id && !id) {
      setPreviewNumber('Enter Pattern ID to see preview');
      return;
    }
    
    setPreviewLoading(true);
    try {
      const patternId = id || formData.num_pat_id;
      const response = await api.post('/numbering/generate/', {
        institution_id: institutionId,
        pattern_id: patternId,
        context: { branch: 'BLR', product: 'TEST' }
      });
      setPreviewNumber(response.data.generated_number);
    } catch (error) {
      setPreviewNumber('Preview not available');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.seq_start >= formData.seq_end) {
      setError('Start number must be less than end number');
      setLoading(false);
      return;
    }

    try {
      let response;
      if (isEditing) {
        response = await api.put(`/numbering/patterns/${id}/`, formData);
        toast.success('Pattern updated successfully');
      } else {
        response = await api.post('/numbering/patterns/', formData);
        toast.success('Pattern created successfully');
        if (response.data.num_pat_id) {
          navigate(`/numbering/${response.data.num_pat_id}`);
          return;
        }
      }
      localStorage.setItem('patterns_updated', Date.now().toString());
      navigate('/numbering');
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to save pattern';
      setError(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTokenDialog = (token = null) => {
    if (token) {
      setEditingToken(token);
      setTokenFormData({
        token_order: token.token_order,
        token_id: token.token_id,
        token_value: token.token_value || '',
        seq_length: token.seq_length || 5,
        reset_policy: token.reset_policy || 'NEVER',
      });
    } else {
      setEditingToken(null);
      setTokenFormData({
        token_order: tokens.length + 1,
        token_id: 'PREFIX',
        token_value: '',
        seq_length: 5,
        reset_policy: 'NEVER',
      });
    }
    setTokenDialogOpen(true);
  };

  const handleCloseTokenDialog = () => {
    setTokenDialogOpen(false);
    setEditingToken(null);
  };

  const handleTokenFormChange = (e) => {
    const { name, value } = e.target;
    setTokenFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTokenTypeChange = (e) => {
    const tokenId = e.target.value;
    const tokenConfig = TOKEN_OPTIONS.find(t => t.value === tokenId);
    setTokenFormData((prev) => ({
      ...prev,
      token_id: tokenId,
      token_value: tokenConfig?.hasValue ? prev.token_value : '',
      seq_length: tokenConfig?.hasLength ? prev.seq_length : null,
      reset_policy: tokenConfig?.hasPolicy ? prev.reset_policy : 'NEVER',
    }));
  };

  const handleSaveToken = async () => {
    const payload = {
      institution_id: institutionId,
      num_pat_id: id || formData.num_pat_id,
      token_order: tokenFormData.token_order,
      token_id: tokenFormData.token_id,
      token_value: tokenFormData.token_value || null,
      seq_length: tokenFormData.seq_length ? parseInt(tokenFormData.seq_length) : null,
      reset_policy: tokenFormData.reset_policy || null,
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
      handleCloseTokenDialog();
      fetchTokens();
      generatePreview();
    } catch (error) {
      console.error('Failed to save token:', error);
      toast.error(error.response?.data?.error || 'Failed to save token');
    }
  };

  const handleDeleteToken = async (tokenId) => {
    if (window.confirm('Are you sure you want to delete this token?')) {
      try {
        await api.delete(`/numbering/details/${tokenId}/`);
        toast.success('Token deleted successfully');
        fetchTokens();
        generatePreview();
      } catch (error) {
        console.error('Failed to delete token:', error);
        toast.error('Failed to delete token');
      }
    }
  };

  const handleMoveToken = async (index, direction) => {
    const newTokens = [...tokens];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= tokens.length) return;
    
    const temp = newTokens[index].token_order;
    newTokens[index].token_order = newTokens[newIndex].token_order;
    newTokens[newIndex].token_order = temp;
    
    const orders = newTokens.map(t => ({ id: t.id, token_order: t.token_order }));
    
    try {
      await api.post('/numbering/details/reorder/', { num_pat_id: id || formData.num_pat_id, orders });
      fetchTokens();
      generatePreview();
      toast.success('Order updated');
    } catch (error) {
      console.error('Failed to reorder:', error);
      toast.error('Failed to reorder');
    }
  };

  const getTokenIcon = (tokenId) => {
    return TOKEN_OPTIONS.find(t => t.value === tokenId)?.icon || '📌';
  };

  const getTokenLabel = (tokenId) => {
    return TOKEN_OPTIONS.find(t => t.value === tokenId)?.label || tokenId;
  };

  const getTokenDescription = (tokenId) => {
    return TOKEN_OPTIONS.find(t => t.value === tokenId)?.description || '';
  };

  const hasSeq = tokens.some(t => t.token_id === 'SEQ');

  if (fetching) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          {isEditing ? 'Edit Numbering Pattern' : 'Create Numbering Pattern'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Configure numbering patterns with tokens to generate unique identifiers for documents, courses, invoices, etc.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2, mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Pattern ID"
                name="num_pat_id"
                value={formData.num_pat_id}
                onChange={handleChange}
                required
                disabled={isEditing}
                helperText="Unique identifier for this pattern (e.g., INV, CRS, ORD)"
                placeholder="e.g., INVOICE, COURSE, ORDER"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Pattern Name"
                name="pattern_name"
                value={formData.pattern_name}
                onChange={handleChange}
                required
                placeholder="e.g., Invoice Numbering Pattern"
                helperText="Descriptive name for this pattern"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                multiline
                rows={2}
                placeholder="Optional remarks about this pattern"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider>
                <Chip label="Sequence Configuration" />
              </Divider>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Start Number"
                name="seq_start"
                type="number"
                value={formData.seq_start}
                onChange={handleChange}
                required
                slotProps={{ htmlInput: { min: 1 } }}
                helperText="Starting number for the sequence"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="End Number"
                name="seq_end"
                type="number"
                value={formData.seq_end}
                onChange={handleChange}
                required
                slotProps={{ htmlInput: { min: formData.seq_start + 1 } }}
                helperText="Maximum number before reset"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Step"
                name="seq_step"
                type="number"
                value={formData.seq_step}
                onChange={handleChange}
                required
                slotProps={{ htmlInput: { min: 1 } }}
                helperText="Increment value (usually 1)"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Preview Section */}
            <Grid item xs={12}>
              <Divider>
                <Chip label="Preview" icon={<Visibility />} />
              </Divider>
            </Grid>

            <Grid item xs={12}>
              <Alert 
                severity="info" 
                icon={<Visibility />}
                action={
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={generatePreview}
                    disabled={previewLoading || (!id && !formData.num_pat_id)}
                  >
                    {previewLoading ? <CircularProgress size={20} /> : 'Generate Preview'}
                  </Button>
                }
              >
                <strong>Preview:</strong>{' '}
                {previewLoading ? 'Generating...' : (previewNumber || 'Enter Pattern ID and add tokens to see preview')}
              </Alert>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={<Save />}
            >
              {loading ? <CircularProgress size={24} /> : (isEditing ? 'Update Pattern' : 'Create Pattern')}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/numbering')}
              startIcon={<Cancel />}
            >
              Cancel
            </Button>
          </Box>
        </form>

        {/* Token Configuration Section - Only show after pattern is created */}
        {(isEditing || formData.num_pat_id) && (
          <Box sx={{ mt: 4 }}>
            <Divider>
              <Chip label="Token Configuration" icon={<Add />} />
            </Divider>
            
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Tokens
                  <Typography variant="caption" sx={{ color: 'text.secondary', ml: 2 }}>
                    Configure how the number is built
                  </Typography>
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => handleOpenTokenDialog()}
                >
                  Add Token
                </Button>
              </Box>

              {!hasSeq && tokens.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  ⚠️ Pattern must contain a SEQ (Sequence) token. Please add a Sequence token.
                </Alert>
              )}

              {tokens.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No tokens configured. Click "Add Token" to start building your numbering pattern.
                  <br />
                  <strong>Example:</strong> PREFIX "INV" + SEQ (length 5) = INV00001
                </Alert>
              ) : (
                <Paper variant="outlined">
                  <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Number Format Preview:
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', mt: 1, p: 1, bgcolor: '#fff', borderRadius: 1 }}>
                      {previewNumber || 'Add tokens to see preview'}
                    </Typography>
                  </Box>
                  <Box>
                    {tokens.map((token, idx) => (
                      <Box
                        key={token.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 2,
                          borderBottom: idx < tokens.length - 1 ? '1px solid #e0e0e0' : 'none',
                          '&:hover': { bgcolor: '#f9f9f9' },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ minWidth: 40, textAlign: 'center' }}>
                            <Chip label={token.token_order} size="small" variant="outlined" />
                          </Box>
                          <Box sx={{ fontSize: 24 }}>{getTokenIcon(token.token_id)}</Box>
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              {getTokenLabel(token.token_id)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {getTokenDescription(token.token_id)}
                            </Typography>
                            {token.token_value && (
                              <Chip 
                                label={`Value: ${token.token_value}`} 
                                size="small" 
                                sx={{ ml: 1 }} 
                              />
                            )}
                            {token.seq_length && (
                              <Chip 
                                label={`Length: ${token.seq_length}`} 
                                size="small" 
                                variant="outlined"
                                sx={{ ml: 1 }} 
                              />
                            )}
                            {token.reset_policy && token.reset_policy !== 'NEVER' && (
                              <Chip 
                                label={`Reset: ${RESET_POLICIES.find(p => p.value === token.reset_policy)?.label}`} 
                                size="small" 
                                color="info"
                                variant="outlined"
                                sx={{ ml: 1 }} 
                              />
                            )}
                          </Box>
                        </Box>
                        <Box>
                          <Tooltip title="Move Up">
                            <IconButton size="small" onClick={() => handleMoveToken(idx, 'up')}>
                              <ArrowUpward fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Move Down">
                            <IconButton size="small" onClick={() => handleMoveToken(idx, 'down')}>
                              <ArrowDownward fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Token">
                            <IconButton size="small" color="primary" onClick={() => handleOpenTokenDialog(token)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Token">
                            <IconButton size="small" color="error" onClick={() => handleDeleteToken(token.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              )}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Add/Edit Token Dialog */}
      <Dialog open={tokenDialogOpen} onClose={handleCloseTokenDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingToken ? 'Edit Token' : 'Add Token'}
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Configure how this token behaves
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label="Token Type"
            name="token_id"
            value={tokenFormData.token_id}
            onChange={handleTokenTypeChange}
            margin="normal"
            disabled={!!editingToken}
            helperText={getTokenDescription(tokenFormData.token_id)}
          >
            {TOKEN_OPTIONS.map(option => (
              <MenuItem 
                key={option.value} 
                value={option.value}
                disabled={option.value === 'SEQ' && hasSeq && !editingToken}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                  <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
                    - {option.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Order"
            name="token_order"
            type="number"
            value={tokenFormData.token_order}
            onChange={handleTokenFormChange}
            margin="normal"
            slotProps={{ htmlInput: { min: 1 } }}
            helperText="Position in the numbering sequence"
          />

          {TOKEN_OPTIONS.find(t => t.value === tokenFormData.token_id)?.hasValue && (
            <TextField
              fullWidth
              label="Token Value"
              name="token_value"
              value={tokenFormData.token_value}
              onChange={handleTokenFormChange}
              margin="normal"
              placeholder="e.g., INV, /, -"
              helperText="The static text to appear in the number"
            />
          )}

          {TOKEN_OPTIONS.find(t => t.value === tokenFormData.token_id)?.hasLength && (
            <TextField
              fullWidth
              label="Sequence Length"
              name="seq_length"
              type="number"
              value={tokenFormData.seq_length || ''}
              onChange={handleTokenFormChange}
              margin="normal"
              placeholder="e.g., 5 for 00001"
              slotProps={{ htmlInput: { min: 1, max: 10 } }}
              helperText="Number of digits (will be zero-padded)"
            />
          )}

          {TOKEN_OPTIONS.find(t => t.value === tokenFormData.token_id)?.hasPolicy && (
            <TextField
              fullWidth
              select
              label="Reset Policy"
              name="reset_policy"
              value={tokenFormData.reset_policy || 'NEVER'}
              onChange={handleTokenFormChange}
              margin="normal"
              helperText="When should the sequence reset?"
            >
              {RESET_POLICIES.map(policy => (
                <MenuItem key={policy.value} value={policy.value}>
                  <Box>
                    <strong>{policy.label}</strong>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      {policy.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTokenDialog}>Cancel</Button>
          <Button onClick={handleSaveToken} variant="contained">
            {editingToken ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default NumberingPatternFormPage;