import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Quiz } from '@/lib/types';

interface QuizCardProps {
  quiz: Quiz;
  index: number;
  onAnswer: (isCorrect: boolean) => void;
  isAnswered: boolean;
}

const QuizCard = ({ quiz, index, onAnswer, isAnswered }: QuizCardProps) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const handleSubmit = () => {
    if (selectedOption === null) return;
    setIsSubmitted(true);
    onAnswer(selectedOption === quiz.correctAnswer);
  };
  
  const getOptionClassName = (optionIndex: number) => {
    if (!isSubmitted) return '';
    
    if (optionIndex === quiz.correctAnswer) {
      return 'text-green-600 font-medium';
    }
    
    if (selectedOption === optionIndex && selectedOption !== quiz.correctAnswer) {
      return 'text-red-600 line-through';
    }
    
    return '';
  };
  
  const isCorrect = isSubmitted && selectedOption === quiz.correctAnswer;

  return (
    <Card className="w-full bg-white">
      <CardHeader className="pb-2">
        <div className="font-medium text-lg">Question {index + 1}</div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">{quiz.question}</div>
        
        <RadioGroup
          value={selectedOption?.toString()}
          onValueChange={(value) => {
            if (!isSubmitted) setSelectedOption(parseInt(value));
          }}
          className="space-y-3"
          disabled={isSubmitted || isAnswered}
        >
          {quiz.options.map((option, optionIndex) => (
            <div key={optionIndex} className="flex items-center space-x-2">
              <RadioGroupItem value={optionIndex.toString()} id={`option-${quiz.id}-${optionIndex}`} />
              <Label 
                htmlFor={`option-${quiz.id}-${optionIndex}`} 
                className={getOptionClassName(optionIndex)}
              >
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
        
        {isSubmitted && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <div className="font-semibold mb-1">
              {isCorrect ? '✅ Correct!' : '❌ Not quite right'}
            </div>
            <div className="text-sm">{quiz.explanation}</div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!isSubmitted && !isAnswered ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedOption === null}
            className="w-full bg-edu-blue hover:bg-edu-blue/90"
          >
            Submit Answer
          </Button>
        ) : (
          <div className="w-full text-center text-sm text-muted-foreground">
            {isAnswered ? 'Already answered' : 'Answer submitted'}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default QuizCard;
