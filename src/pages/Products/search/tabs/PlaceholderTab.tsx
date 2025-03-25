import { Typography, Paper, Stack, alpha, useTheme } from '@mui/material';
import { PlaceholderTabProps } from '../components/types';

const PlaceholderTab = ({ title }: PlaceholderTabProps) => {
  const theme = useTheme();
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        minHeight: '300px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        borderRadius: 2,
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(8px)'
      }}
    >
      <Stack spacing={2} alignItems="center">
        <Typography variant="h6" color="text.secondary">
          {title} Tab
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This feature is coming soon.
        </Typography>
      </Stack>
    </Paper>
  );
};

export default PlaceholderTab; 