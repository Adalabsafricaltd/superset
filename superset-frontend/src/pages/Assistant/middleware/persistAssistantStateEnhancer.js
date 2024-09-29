import persistState from 'redux-localstorage';

/**
 * Assistant Local Storage State Enhancer
 */

const assistantPersistConfig = {
  paths: ['assistant'],
  config: {
    key: 'assistant',
    slicer: paths => state => {
      const assistantState = state['assistant'];
      return assistantState;
    },
    merge: (initialState, persistedState) => {
      const mergedState = {
        ...initialState,
        assistant: {
          ...initialState.assistant,
          ...persistedState,
        },
      };
      return mergedState;
    },
  },
};

export const persistAssistantStateEnhancer = persistState(
  assistantPersistConfig.paths,
  assistantPersistConfig.config,
);
