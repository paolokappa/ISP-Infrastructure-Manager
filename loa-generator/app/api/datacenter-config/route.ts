import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Helper function to read datacenter configuration from file
function readDatacenterConfig() {
  const configPath = path.join(process.cwd(), 'config', 'datacenter-db.ts')
  const content = fs.readFileSync(configPath, 'utf-8')
  
  // Extract the datacenter array from the file
  const startIndex = content.indexOf('export const datacenterDatabase: DatacenterInfo[] = [')
  const endIndex = content.indexOf('];', startIndex) + 1
  
  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Could not parse datacenter configuration file')
  }
  
  const datacentersString = content.substring(
    content.indexOf('[', startIndex),
    endIndex
  )
  
  // Evaluate the string to get the actual array
  // Note: This is safe because we control the file content
  try {
    const datacenters = eval(`(${datacentersString})`)
    return datacenters
  } catch (error) {
    console.error('Error parsing datacenter data:', error)
    throw new Error('Failed to parse datacenter configuration')
  }
}

export async function POST(request: Request) {
  try {
    const { datacenters } = await request.json()
    
    // Generate the new datacenter-db.ts content
    const configPath = path.join(process.cwd(), 'config', 'datacenter-db.ts')
    
    // Read the existing file to preserve the interface and helper functions
    const existingContent = fs.readFileSync(configPath, 'utf-8')
    
    // Find where the database array starts and ends
    const startIndex = existingContent.indexOf('export const datacenterDatabase: DatacenterInfo[] = [')
    const endIndex = existingContent.indexOf('];', startIndex) + 2
    
    if (startIndex === -1 || endIndex === -1) {
      return NextResponse.json(
        { error: 'Could not parse datacenter configuration file' },
        { status: 500 }
      )
    }
    
    // Generate the new datacenter array content with proper formatting
    const formattedDatacenters = JSON.stringify(datacenters, null, 2)
      .replace(/"([^"]+)":/g, '"$1":') // Keep quotes on keys for JSON format
    const newDatacentersContent = `export const datacenterDatabase: DatacenterInfo[] = ${formattedDatacenters};`
    
    // Combine the parts
    const newContent = 
      existingContent.substring(0, startIndex) + 
      newDatacentersContent +
      existingContent.substring(endIndex)
    
    // Write the updated content back to the file
    fs.writeFileSync(configPath, newContent)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Configuration saved successfully' 
    })
  } catch (error) {
    console.error('Error saving datacenter configuration:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Read the current datacenter configuration directly from file
    const datacenters = readDatacenterConfig()
    
    return NextResponse.json({ 
      datacenters 
    })
  } catch (error) {
    console.error('Error loading datacenter configuration:', error)
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    )
  }
}