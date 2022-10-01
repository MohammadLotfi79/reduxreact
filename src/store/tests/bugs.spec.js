import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { loadBugs, addBug, resolveBug, getUnresolvedBugs } from '../bugs';
import configureStore from '../configureStore';

// We don't care about middleware functions and we don't test them because they are part of the implementation
// which we don't care about.

describe("bugsSlice", () => {
  let fakeAxios;
  let store;

  beforeEach(() => {
    fakeAxios = new MockAdapter(axios);
    store = configureStore();
  })

  const bugsSlice = () => store.getState().entities.bugs;

  const createState = () => ({
    entities: {
      bugs: {
        list: []
      }
    }
  });

  describe("loading bugs", () => {
    describe("if the bugs exist in the cache", () => {
      it("they should be fetched from the server and put in the store", async () => {
        fakeAxios.onGet("/bugs").reply(200, [{ id: 1 }]);

        await store.dispatch(loadBugs())

        expect(bugsSlice().list).toHaveLength(1)
      })

      it("they should not be fetched from the server again.", async () => {
        fakeAxios.onGet("/bugs").reply(200, [{ id: 1 }]);

        await store.dispatch(loadBugs())
        await store.dispatch(loadBugs())

        expect(fakeAxios.history.get.length).toBe(1)
      })
    })

    describe("if the bugs don't exist in the cache", () => {
      describe("loading indicator", () => {
        it("should be true while fetching the bugs", () => {
          // fakeAxios.onGet("/bugs").reply(200, [{ id: 1 }])
          fakeAxios.onGet("/bugs").reply(() => {
            expect(bugsSlice().loading).toBe(true);
            return [200, [{ id: 1 }]];
          })

          store.dispatch(loadBugs())
        })

        it("should be false after the bugs are fetched", async () => {
          fakeAxios.onGet("/bugs").reply(200, [{ id: 1 }])

          await store.dispatch(loadBugs())

          expect(bugsSlice().loading).toBe(false)
        })

        it("should be false if the server returns an error", async () => {
          fakeAxios.onGet("/bugs").reply(500)

          await store.dispatch(loadBugs())

          expect(bugsSlice().loading).toBe(false)
        })
      })
    })
  })

  it("should mark the bug as resolved if it's saved to the server", async () => {
    // AAA
    fakeAxios.onPatch("/bugs/1").reply(200, { id: 1, resolved: true });
    fakeAxios.onPost("/bugs").reply(200, { id: 1 })

    await store.dispatch(addBug({}));
    await store.dispatch(resolveBug(1));

    expect(bugsSlice().list[0].resolved).toBe(true);
  });

  it("should not mark the bug as resolved if it's not saved to the server", async () => {
    // AAA
    fakeAxios.onPatch("/bugs/1").reply(500);
    fakeAxios.onPost("/bugs").reply(200, { id: 1 })

    await store.dispatch(addBug({}));
    await store.dispatch(resolveBug(1));

    expect(bugsSlice().list[0].resolved).not.toBe(true);
  });

  it("should add the bug to the store if it's saved to the server", async () => {
    // AAA test pattern -> Arrange, Act, Assert

    // Arrange -> all the initialization code
    const bug = { description: 'a' };
    const savedBug = { ...bug, id: 1 };
    fakeAxios.onPost('/bugs').reply(200, savedBug);

    // Act -> pokes the system
    // When we return the 'next(action)' from the logger and toast middleware, they return the api middleware which then
    // returns a promise. We await that promise and wait for the api call to be resolved and the bug to be added to the
    // store. if we don't return anything from the logger middleware, then the result of the 'store.dispatch(addBug(bug))'
    // is nothing(undefined) so, we can't wait for the addBug api call to finish, so out bug slice would be empty which is
    // not correct.
    const x = await store.dispatch(addBug(bug))

    // Assert -> contains the expectation code
    expect(bugsSlice().list).toContainEqual(savedBug);
  })

  it("should not add the bug to the store if it's not saved to the server", async () => {
    const bug = { description: 'a' };
    fakeAxios.onPost('/bugs').reply(500);

    const x = await store.dispatch(addBug(bug))

    expect(bugsSlice().list).toHaveLength(0);
  })

  describe("selectors", () => {
    it("getUnresolvedBugs", () => {
      const state = createState();
      state.entities.bugs.list = [
        { id: 1, resolved: true },
        { id: 2 },
        { id: 3 },
      ]

      const result = getUnresolvedBugs(state);

      expect(result).toHaveLength(2);
    })
  })
})