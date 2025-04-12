// Mock for the database connection
const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
  on: jest.fn(),
};

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

// Mock implementation for the database connection
const db = {
  pool: mockPool,
  
  query: jest.fn().mockImplementation(async (text, params) => {
    return mockPool.query(text, params);
  }),
  
  getClient: jest.fn().mockImplementation(async () => {
    mockClient.query = jest.fn().mockImplementation(async (text, params) => {
      return mockPool.query(text, params);
    });
    return mockClient;
  }),
  
  testConnection: jest.fn().mockImplementation(async () => {
    return true;
  }),
};

// Helper function to reset all mocks
const resetMocks = () => {
  mockPool.query.mockReset();
  mockPool.connect.mockReset();
  mockPool.end.mockReset();
  mockPool.on.mockReset();
  
  mockClient.query.mockReset();
  mockClient.release.mockReset();
  
  db.query.mockReset();
  db.getClient.mockReset();
  db.testConnection.mockReset();
  
  // Default implementation
  db.query.mockImplementation(async (text, params) => {
    return mockPool.query(text, params);
  });
  
  db.getClient.mockImplementation(async () => {
    mockClient.query = jest.fn().mockImplementation(async (text, params) => {
      return mockPool.query(text, params);
    });
    return mockClient;
  });
  
  db.testConnection.mockImplementation(async () => {
    return true;
  });
};

export { db, mockPool, mockClient, resetMocks };

// Mock the database module
jest.mock('../../db/connection', () => {
  return {
    __esModule: true,
    default: db,
  };
});
