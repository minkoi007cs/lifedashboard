import { Repository } from 'typeorm';
import { SocialService } from './social.service';
import { SocialChannel } from './entities/social-channel.entity';
import { SocialPost } from './entities/social-post.entity';

type MockRepository<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('SocialService', () => {
  let socialService: SocialService;
  let channelRepo: MockRepository<SocialChannel>;
  let postRepo: MockRepository<SocialPost>;

  beforeEach(() => {
    channelRepo = {
      count: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'ch-1', ...entity })),
      remove: jest.fn().mockResolvedValue({}),
    };

    postRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: 'post-1', ...entity })),
      remove: jest.fn().mockResolvedValue({}),
    };

    socialService = new SocialService(
      channelRepo as Repository<SocialChannel>,
      postRepo as Repository<SocialPost>,
    );
  });

  it('should seed default channels if user has none', async () => {
    (channelRepo.count as jest.Mock).mockResolvedValueOnce(0);
    const channels = await socialService.getChannels('user-1');

    expect(channelRepo.count).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(channelRepo.save).toHaveBeenCalled();
  });

  it('should generate creative social content with hooks and hashtags', async () => {
    const result = await socialService.generateAiContent(
      '5 tips for productive remote work',
      'youtube' as any,
    );

    expect(result.hook.length).toBeGreaterThan(0);
    expect(result.caption.length).toBeGreaterThan(0);
    expect(result.hashtags.length).toBeGreaterThan(0);
  });

  it('should update post status successfully', async () => {
    const mockPost = {
      id: 'post-100',
      userId: 'user-1',
      title: 'Demo post',
      status: 'draft',
    };
    (postRepo.findOne as jest.Mock).mockResolvedValue(mockPost);

    const updated = await socialService.updatePost('post-100', 'user-1', {
      status: 'published',
    });

    expect(postRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'published',
      }),
    );
    expect(updated.status).toBe('published');
  });
});
