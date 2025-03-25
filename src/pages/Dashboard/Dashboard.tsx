import { Typography, Box, Grid, Paper, Stack, Card, CardContent, CardHeader, Divider } from '@mui/material';
import { 
  BarChart, 
  LineChart, 
  PieChart,
  ScatterChart
} from '@mui/x-charts';

export default function Dashboard() {
  // Dummy data for ecommerce search analytics
  const searchVolumeData = [
    { day: 'Mon', searches: 2400 },
    { day: 'Tue', searches: 1398 },
    { day: 'Wed', searches: 9800 },
    { day: 'Thu', searches: 3908 },
    { day: 'Fri', searches: 4800 },
    { day: 'Sat', searches: 3800 },
    { day: 'Sun', searches: 4300 },
  ];

  const conversionRateData = [
    { month: 'Jan', rate: 0.12 },
    { month: 'Feb', rate: 0.13 },
    { month: 'Mar', rate: 0.15 },
    { month: 'Apr', rate: 0.14 },
    { month: 'May', rate: 0.17 },
    { month: 'Jun', rate: 0.16 },
    { month: 'Jul', rate: 0.18 },
  ];

  const topSearchTerms = [
    { id: 0, value: 35, label: 'shoes' },
    { id: 1, value: 20, label: 'shirts' },
    { id: 2, value: 15, label: 'jeans' },
    { id: 3, value: 10, label: 'jackets' },
    { id: 4, value: 20, label: 'accessories' },
  ];

  const searchToCartData = [
    { x: 10, y: 5, id: 'Product A' },
    { x: 15, y: 10, id: 'Product B' },
    { x: 20, y: 15, id: 'Product C' },
    { x: 25, y: 20, id: 'Product D' },
    { x: 30, y: 25, id: 'Product E' },
    { x: 35, y: 15, id: 'Product F' },
    { x: 40, y: 30, id: 'Product G' },
    { x: 45, y: 25, id: 'Product H' },
    { x: 50, y: 35, id: 'Product I' },
  ];

  const searchResultsClickData = [
    { time: 'Week 1', organic: 4000, sponsored: 2400 },
    { time: 'Week 2', organic: 3000, sponsored: 1398 },
    { time: 'Week 3', organic: 2000, sponsored: 9800 },
    { time: 'Week 4', organic: 2780, sponsored: 3908 },
    { time: 'Week 5', organic: 1890, sponsored: 4800 },
    { time: 'Week 6', organic: 2390, sponsored: 3800 },
    { time: 'Week 7', organic: 3490, sponsored: 4300 },
  ];
  
  return (
    <Box sx={{ 
      p: 3,
      bgcolor: 'background.default',
      minHeight: '100vh'
    }}>
      <Typography 
        variant="h4" 
        sx={{
          color: 'text.primary',
          mb: 3
        }}
      >
        Search Analytics Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Searches
              </Typography>
              <Typography variant="h4">24,532</Typography>
              <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                +12% from last week
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Conversion Rate
              </Typography>
              <Typography variant="h4">15.8%</Typography>
              <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                +2.3% from last week
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Avg. Search
              </Typography>
              <Typography variant="h4">3.2 days</Typography>
              <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
                +0.5 days from last week
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Zero Results Rate
              </Typography>
              <Typography variant="h4">4.3%</Typography>
              <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                -1.2% from last week
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Search Volume Trend */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Daily Search Volume</Typography>
            <BarChart
              xAxis={[{ 
                scaleType: 'band', 
                data: searchVolumeData.map(item => item.day),
                label: 'Day of Week'
              }]}
              series={[{ 
                data: searchVolumeData.map(item => item.searches),
                label: 'Number of Searches',
                color: '#2196f3'
              }]}
              height={300}
            />
          </Paper>
        </Grid>

        {/* Conversion Rate Trend */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Monthly Conversion Rate</Typography>
            <LineChart
              xAxis={[{ 
                data: conversionRateData.map((_, index) => index),
                scaleType: 'linear',
                valueFormatter: (index) => conversionRateData[index].month
              }]}
              series={[
                {
                  data: conversionRateData.map(item => item.rate),
                  label: 'Conversion Rate',
                  color: '#4caf50',
                  area: true,
                },
              ]}
              height={300}
              yAxis={[{ 
                min: 0,
                max: 0.2,
                tickNumber: 5,
                valueFormatter: (value) => `${(value * 100).toFixed(0)}%`,
              }]}
            />
          </Paper>
        </Grid>

        {/* Top Search Terms */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Top Search Terms</Typography>
            <PieChart
              series={[
                {
                  data: topSearchTerms,
                  innerRadius: 30,
                  outerRadius: 100,
                  paddingAngle: 2,
                  cornerRadius: 5,
                  startAngle: -90,
                  endAngle: 270,
                  cx: 150,
                  cy: 150,
                }
              ]}
              height={300}
              slotProps={{
                legend: {
                  direction: 'row',
                  position: { vertical: 'bottom', horizontal: 'middle' },
                  padding: 0,
                },
              }}
            />
          </Paper>
        </Grid>

        {/* Search to Cart Correlation */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Search to Cart Correlation</Typography>
            <ScatterChart
              series={[
                {
                  data: searchToCartData.map(item => ({ x: item.x, y: item.y, id: item.id })),
                  label: 'Products',
                  valueFormatter: ({ x, y }) => `Searches: ${x}, Cart Adds: ${y}`,
                }
              ]}
              width={500}
              height={300}
              xAxis={[{ 
                label: 'Search Volume',
                min: 0,
              }]}
              yAxis={[{ 
                label: 'Cart Additions',
                min: 0,
              }]}
            />
          </Paper>
        </Grid>

        {/* Organic vs Sponsored Results */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Organic vs Sponsored Results Clicks</Typography>
            <LineChart
              series={[
                {
                  data: searchResultsClickData.map(item => item.organic),
                  label: 'Organic Clicks',
                  area: true,
                  stack: 'total',
                  color: '#4caf50',
                },
                {
                  data: searchResultsClickData.map(item => item.sponsored),
                  label: 'Sponsored Clicks',
                  area: true,
                  stack: 'total',
                  color: '#ff9800',
                }
              ]}
              xAxis={[{
                scaleType: 'band',
                data: searchResultsClickData.map(item => item.time),
                label: 'Time Period',
              }]}
              height={400}
              margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 