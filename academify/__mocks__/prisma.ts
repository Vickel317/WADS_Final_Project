const makeMock = () => ({
  findUnique: jest.fn(),
  findMany: jest.fn().mockResolvedValue([]),
  findFirst: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn().mockResolvedValue(0),
  upsert: jest.fn(),
});

export const prisma = {
  user: makeMock(),
  post: makeMock(),
  comment: makeMock(),
  file: makeMock(),
  space: makeMock(),
  forum: makeMock(),
  forumHub: makeMock(),
  category: makeMock(),
  report: makeMock(),
  message: makeMock(),
  notification: makeMock(),
  event: makeMock(),
  tag: makeMock(),

  // models used by dashboard/profile pages
  eventAttendee: makeMock(),
  spaceMember: makeMock(),
  follow: makeMock(),
  collabSpace: makeMock(),

  $transaction: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

