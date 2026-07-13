import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Missing lat or lon' }, { status: 400 });
  }

  try {
    // inaRISK ArcGIS MapServer Endpoint for "Bahaya Banjir"
    // Using identify to get pixel value at a specific coordinate
    const url = `https://gis.bnpb.go.id/server/rest/services/inarisk/layer_bahaya_banjir_30/MapServer/identify?geometry=${lon},${lat}&geometryType=esriGeometryPoint&sr=4326&tolerance=2&mapExtent=106,-7,107,-6&imageDisplay=800,600,96&returnGeometry=false&f=json`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      next: { revalidate: 86400 } // cache for 24 hours
    });

    if (!response.ok) {
      throw new Error(`InaRisk returned ${response.status}`);
    }

    const data = await response.json();
    
    let pixelValue = 0;
    
    if (data.results && data.results.length > 0) {
      const attrs = data.results[0].attributes;
      const rawValue = attrs['Stretch.Pixel Value'] || attrs['Pixel Value'];
      
      if (rawValue && rawValue !== 'NoData') {
        pixelValue = parseFloat(rawValue);
      }
    }

    let riskLevel = 'Aman';
    if (pixelValue > 0) {
      if (pixelValue < 0.3) riskLevel = 'Rendah';
      else if (pixelValue < 0.6) riskLevel = 'Sedang';
      else riskLevel = 'Tinggi';
    }

    return NextResponse.json({
      success: true,
      riskLevel,
      pixelValue,
      isFloodFree: riskLevel === 'Aman' || riskLevel === 'Rendah'
    });
  } catch (error: any) {
    console.error('InaRisk API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to fetch from InaRisk' 
    }, { status: 500 });
  }
}
