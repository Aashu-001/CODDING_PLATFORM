import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NavLink, useNavigate } from 'react-router';
import axiosClient from '../utils/axiosClient';

const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array', 'linkedList', 'graph', 'dp']),
  visibleTestCases: z
    .array(
      z.object({
        input: z.string().min(1, 'Input is required'),
        output: z.string().min(1, 'Output is required'),
        explanation: z.string().min(1, 'Explanation is required')
      })
    )
    .min(1, 'At least one visible test case required'),
  hiddenTestCases: z
    .array(
      z.object({
        input: z.string().min(1, 'Input is required'),
        output: z.string().min(1, 'Output is required')
      })
    )
    .min(1, 'At least one hidden test case required'),
  startCode: z
    .array(
      z.object({
        language: z.enum(['C++', 'Java', 'JavaScript']),
        initialCode: z.string().min(1, 'Initial code is required')
      })
    )
    .length(3, 'All three languages required'),
  referenceSolution: z
    .array(
      z.object({
        language: z.enum(['C++', 'Java', 'JavaScript']),
        completeCode: z.string().min(1, 'Complete code is required')
      })
    )
    .length(3, 'All three languages required')
});

const defaultValues = {
  title: '',
  description: '',
  difficulty: 'easy',
  tags: 'array',
  visibleTestCases: [{ input: '', output: '', explanation: '' }],
  hiddenTestCases: [{ input: '', output: '' }],
  startCode: [
    { language: 'C++', initialCode: '' },
    { language: 'Java', initialCode: '' },
    { language: 'JavaScript', initialCode: '' }
  ],
  referenceSolution: [
    { language: 'C++', completeCode: '' },
    { language: 'Java', completeCode: '' },
    { language: 'JavaScript', completeCode: '' }
  ]
};

function AdminPanel() {
  const navigate = useNavigate();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues
  });

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible
  } = useFieldArray({
    control,
    name: 'visibleTestCases'
  });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden
  } = useFieldArray({
    control,
    name: 'hiddenTestCases'
  });

  const onSubmit = async (payload) => {
    try {
      await axiosClient.post('/problem/create', payload);
      alert('Problem created successfully!');
      reset(defaultValues);
      navigate('/admin');
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Create New Problem</h1>
        <NavLink to="/admin" className="btn btn-outline btn-sm">
          Back to Admin Panel
        </NavLink>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="card bg-base-100 shadow-2xl shadow-black/30 border border-base-300/40 p-5">
          <h2 className="text-xl font-semibold mb-3">Basic Information</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[10rem_minmax(0,1fr)] items-start gap-2 md:gap-4">
              <label className="md:pt-2 text-base-content/80">Title</label>
              <div>
                <input
                  {...register('title')}
                  className={`input input-bordered w-full ${errors.title ? 'input-error' : ''}`}
                />
                {errors.title && <span className="text-error">{errors.title.message}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[10rem_minmax(0,1fr)] items-start gap-2 md:gap-4">
              <label className="md:pt-2 text-base-content/80">Description</label>
              <div>
                <textarea
                  {...register('description')}
                  className={`textarea textarea-bordered h-32 w-full ${errors.description ? 'textarea-error' : ''}`}
                />
                {errors.description && <span className="text-error">{errors.description.message}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[10rem_minmax(0,1fr)] items-start gap-2 md:gap-4">
              <label className="md:pt-2 text-base-content/80">Difficulty</label>
              <select
                {...register('difficulty')}
                className={`select select-bordered w-full ${errors.difficulty ? 'select-error' : ''}`}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[10rem_minmax(0,1fr)] items-start gap-2 md:gap-4">
              <label className="md:pt-2 text-base-content/80">Tag</label>
              <select
                {...register('tags')}
                className={`select select-bordered w-full ${errors.tags ? 'select-error' : ''}`}
              >
                <option value="array">Array</option>
                <option value="linkedList">Linked List</option>
                <option value="graph">Graph</option>
                <option value="dp">DP</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-2xl shadow-black/30 border border-base-300/40 p-5">
          <h2 className="text-xl font-semibold mb-4">Test Cases</h2>

          <div className="space-y-4 mb-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Visible Test Cases</h3>
              <button
                type="button"
                onClick={() => appendVisible({ input: '', output: '', explanation: '' })}
                className="btn btn-sm btn-primary"
              >
                Add Visible
              </button>
            </div>

            {visibleFields.map((field, index) => (
              <div key={field.id} className="card bg-base-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    {...register(`visibleTestCases.${index}.input`)}
                    placeholder="Input"
                    className={`input input-bordered ${errors.visibleTestCases?.[index]?.input ? 'input-error' : ''}`}
                  />
                  <input
                    {...register(`visibleTestCases.${index}.output`)}
                    placeholder="Output"
                    className={`input input-bordered ${errors.visibleTestCases?.[index]?.output ? 'input-error' : ''}`}
                  />
                  <input
                    {...register(`visibleTestCases.${index}.explanation`)}
                    placeholder="Explanation"
                    className={`input input-bordered ${errors.visibleTestCases?.[index]?.explanation ? 'input-error' : ''}`}
                  />
                </div>

                {visibleFields.length > 1 && (
                  <div className="flex justify-center mt-2">
                    <button
                      type="button"
                      onClick={() => removeVisible(index)}
                      className="btn btn-sm btn-error w-1/2"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Hidden Test Cases</h3>
              <button
                type="button"
                onClick={() => appendHidden({ input: '', output: '' })}
                className="btn btn-sm btn-primary"
              >
                Add Hidden
              </button>
            </div>

            {hiddenFields.map((field, index) => (
              <div key={field.id} className="card bg-base-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    {...register(`hiddenTestCases.${index}.input`)}
                    placeholder="Input"
                    className={`input input-bordered ${errors.hiddenTestCases?.[index]?.input ? 'input-error' : ''}`}
                  />
                  <input
                    {...register(`hiddenTestCases.${index}.output`)}
                    placeholder="Output"
                    className={`input input-bordered ${errors.hiddenTestCases?.[index]?.output ? 'input-error' : ''}`}
                  />
                </div>

                {hiddenFields.length > 1 && (
                  <div className="flex justify-center mt-2">
                    <button
                      type="button"
                      onClick={() => removeHidden(index)}
                      className="btn btn-sm btn-error w-1/2"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card bg-base-100 shadow-2xl shadow-black/30 border border-base-300/40 p-5">
          <h2 className="text-xl font-semibold mb-4">Starter Code</h2>
          <div className="space-y-4">
            {['C++', 'Java', 'JavaScript'].map((language, index) => (
              <div key={language} className="grid grid-cols-1 md:grid-cols-[10rem_minmax(0,1fr)] items-start gap-2 md:gap-4">
                <label className="md:pt-2 text-base-content/80">{language}</label>
                <div>
                  <textarea
                    {...register(`startCode.${index}.initialCode`)}
                    className={`textarea textarea-bordered h-28 w-full text-left ${errors.startCode?.[index]?.initialCode ? 'textarea-error' : ''}`}
                  />
                  <input type="hidden" {...register(`startCode.${index}.language`)} value={language} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card bg-base-100 shadow-2xl shadow-black/30 border border-base-300/40 p-5">
          <h2 className="text-xl font-semibold mb-4">Reference Solution</h2>
          <div className="space-y-4">
            {['C++', 'Java', 'JavaScript'].map((language, index) => (
              <div key={language} className="grid grid-cols-1 md:grid-cols-[10rem_minmax(0,1fr)] items-start gap-2 md:gap-4">
                <label className="md:pt-2 text-base-content/80">{language}</label>
                <div>
                  <textarea
                    {...register(`referenceSolution.${index}.completeCode`)}
                    className={`textarea textarea-bordered h-28 w-full text-left ${errors.referenceSolution?.[index]?.completeCode ? 'textarea-error' : ''}`}
                  />
                  <input type="hidden" {...register(`referenceSolution.${index}.language`)} value={language} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className={`btn btn-primary px-8 ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Problem'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminPanel;
