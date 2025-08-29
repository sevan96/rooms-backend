import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RoomService } from './room.service';
import { Room } from './room.schema';

describe('RoomService', () => {
  let service: RoomService;
  let mockRoomModel: any;

  beforeEach(async () => {
    // Mock simple pour tester les fonctionnalités de base
    mockRoomModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        {
          provide: getModelToken(Room.name),
          useValue: mockRoomModel,
        },
      ],
    }).compile();

    service = module.get<RoomService>(RoomService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all rooms', async () => {
    const mockRooms = [
      { name: 'Salle A', description: 'Description A', access_code: '123456', company: 'Company1', available: true },
    ];
    
    mockRoomModel.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockRooms),
    });

    const result = await service.findAll();
    expect(result).toEqual(mockRooms);
    expect(mockRoomModel.find).toHaveBeenCalled();
  });
});
