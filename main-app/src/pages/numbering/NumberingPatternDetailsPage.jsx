import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import TokenGrid from '../../components/NumberingPatterns/TokenGrid';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Refresh,
  Visibility,
  Code,
  Calculate,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const NumberingPatternDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pattern, setPattern] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generatedNumber, setGeneratedNumber] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [context, setContext] = useState({ branch: '', product: '' });
  const { user } = useAuth();
  const institutionId = user?.institutionId || 'INST001';

  useEffect(() => {
    fetchPattern();
  }, [id]);

  const fetchPattern = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/numbering/patterns/${id}/`);
      setPattern(response.data);
    } catch (error) {
      console.error('Failed to fetch pattern:', error);
      toast.error('Failed to load pattern details');
      navigate('/numbering');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await api.post('/numbering/generate/', {
        institution_id: institutionId,
        pattern_id: id,
        context: context
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

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this pattern?')) {
      try {
        await api.delete(`/numbering/patterns/${id}/`);
        toast.success('Pattern deleted successfully');
        navigate('/numbering');
      } catch (error) {
        console.error('Failed to delete pattern:', error);
        toast.error('Failed to delete pattern');
      }
    }
  };

  const getStatusChip = (status) => {
    const colors = {
      ACTIVE: 'success',
      INACTIVE: 'default',
      DELETED: 'error'
    };
    return <Chip label={status} color={colors[status] || 'default'} size="small" />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!pattern) {
    return (
      <Container>
        <Alert severity="error">Pattern not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/numbering')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" flex={1}>
          Pattern Details: {pattern.pattern_name}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchPattern}
          sx={{ mr: 1 }}
        >
          Refresh
        </Button>
        <Button
          variant="outlined"
          startIcon={<Edit />}
          onClick={() => navigate(`/numbering/${id}/edit`)}
          sx={{ mr: 1 }}
        >
          Edit Pattern
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<Delete />}
          onClick={handleDelete}
        >
          Delete
        </Button>
      </Box>

      {/* Pattern Information */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pattern Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">
                    Pattern ID:
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2" fontFamily="monospace">
                    {pattern.num_pat_id}
                  </Typography>
                </Grid>

                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">
                    Pattern Name:
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">
                    {pattern.pattern_name}
                  </Typography>
                </Grid>

                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">
                    Status:
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  {getStatusChip(pattern.status)}
                </Grid>

                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">
                    Sequence Range:
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">
                    {pattern.seq_start} → {pattern.seq_end} (Step: {pattern.seq_step})
                  </Typography>
                </Grid>

                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">
                    Remarks:
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">
                    {pattern.remarks || '-'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Generate Number
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box mb={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Branch (Optional)"
                  value={context.branch}
                  onChange={(e) => setContext({ ...context, branch: e.target.value })}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Product (Optional)"
                  value={context.product}
                  onChange={(e) => setContext({ ...context, product: e.target.value })}
                  margin="normal"
                />
              </Box>
              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setContext({ branch: '', product: '' });
                    handleGenerate();
                  }}
                  disabled={generating}
                >
                  Generate Number
                </Button>
              </Box>
              {generatedNumber && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <strong>Generated Number:</strong> {generatedNumber}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Token Configuration */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Token Configuration
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TokenGrid
                institutionId={institutionId}
                numPatId={id}
                onRefresh={fetchPattern}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default NumberingPatternDetailsPage;