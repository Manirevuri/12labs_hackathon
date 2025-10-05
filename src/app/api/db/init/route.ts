import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db/init';

export async function POST(request: NextRequest) {
  try {
    const success = await initDatabase();
    
    if (success) {
      return NextResponse.json({ 
        message: 'Database initialized successfully',
        success: true 
      });
    } else {
      return NextResponse.json({ 
        error: 'Failed to initialize database',
        success: false 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ 
      error: 'Database initialization failed',
      success: false 
    }, { status: 500 });
  }
}